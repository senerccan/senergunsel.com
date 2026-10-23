# Vans capstone survey, re-read
# NYU Stern x Vans APAC capstone, Shanghai, spring 2024. The analysis behind
# senergunsel.com/projects/vans-capstone/.
#
# The survey asked 220 NYU Shanghai students (106 Chinese nationals, 114 international
# students) whether they skateboard, which brands they associate with skateboarding
# (rank up to three), whether they wear Vans, who pays, how Vans is priced, and why.
#
# This script: 1 reads the anonymized responses, 2 recounts the descriptives,
# 3 reproduces the ordinal regression as it was reported in 2024, 4 re-runs it with
# the outcome in a sensible order and with skating and segment as controls, and
# 5 writes the figures and a results file. Run it from the folder that holds
# vans-survey-2024.csv:   Rscript vans-survey-analysis.R
#
# Sener Can Gunsel, 2026. Needs MASS, nnet, dplyr, tidyr, ggplot2 and jsonlite.

suppressPackageStartupMessages({
  library(MASS)     # polr: ordinal (proportional odds) logistic regression
  library(nnet)     # multinom: the check on the proportional odds assumption
  library(dplyr)
  library(tidyr)
  library(ggplot2)
})
dir.create("results", showWarnings = FALSE)
out <- list()

# ---------------------------------------------------------------- 1 The responses
d <- read.csv("vans-survey-2024.csv", stringsAsFactors = FALSE)
stopifnot(nrow(d) == 220)
d <- d %>% mutate(
  segment = factor(segment, levels = c("chinese", "international")),
  skate   = factor(skate, levels = c("never", "former", "current")),
  wear    = factor(wear, levels = c("never", "former", "current")),
  price   = factor(price, levels = c("low", "mid", "high")),
  pays    = factor(pays, levels = c("self", "other"))
)
brands <- c(nikesb = "Nike SB", supreme = "Supreme", adidas = "Adidas", vans = "Vans", converse = "Converse", other = "Other")
# Rank points as in the 2024 analysis: 1st choice = 3, 2nd = 2, 3rd = 1, not ranked = 0.
for (b in names(brands)) d[[paste0("pts_", b)]] <- ifelse(is.na(d[[paste0("rank_", b)]]), 0, 4 - d[[paste0("rank_", b)]])

# ---------------------------------------------------------------- 2 Descriptives
share <- function(x) round(100 * prop.table(table(x)), 1)
cat("\n== Who answered\n"); print(table(d$segment))
cat("\n== Do you skateboard? (count, then % within segment)\n")
print(table(d$segment, d$skate)); print(round(100 * prop.table(table(d$segment, d$skate), 1), 1))
cat("\n== Do you wear Vans?\n")
print(table(d$segment, d$wear)); print(round(100 * prop.table(table(d$segment, d$wear), 1), 1))
cat("\n== Skating and wearing Vans\n")
print(table(d$skate, d$wear)); print(round(100 * prop.table(table(d$skate, d$wear), 1), 1))

cat("\n== Which brand do people associate most with skateboarding? (% ranking it first / in their top three)\n")
assoc <- lapply(c("chinese", "international", "all"), function(s) {
  sub <- if (s == "all") d else d[d$segment == s, ]
  data.frame(segment = s, brand = unname(brands),
             first = sapply(names(brands), function(b) mean(!is.na(sub[[paste0("rank_", b)]]) & sub[[paste0("rank_", b)]] == 1)),
             top3 = sapply(names(brands), function(b) mean(!is.na(sub[[paste0("rank_", b)]]))),
             n = nrow(sub), row.names = NULL)
}) %>% bind_rows()
print(assoc %>% mutate(first = round(100 * first), top3 = round(100 * top3)))

cat("\n== How is Vans priced? (by whether they wear it)\n")
print(table(d$wear, d$price)); print(round(100 * prop.table(table(d$wear, d$price), 1), 1))
cat("\n== Who pays? (wearers and former wearers)\n")
print(table(d$wear, d$pays))

cat("\n== Why? Open answers hand-coded into themes (a response can carry several)\n")
themes <- grep("^theme_", names(d), value = TRUE)
why <- d %>% group_by(wear) %>% summarise(n = n(), across(all_of(themes), sum), .groups = "drop")
print(as.data.frame(why))

# ---------------------------------------------------------------- 3 The regression as reported in 2024
# The capstone fitted an ordinal logistic regression of wearing Vans on the six brands'
# rank points, with the outcome coded Yes = 3, No = 2, "I used to" = 1 and treated as
# ordered. That order puts "never wore Vans" above "used to wear Vans", which makes the
# coefficients hard to read. It is reproduced here so the numbers can be checked
# against the report (figure 1 and figure 2 match; figure 3, the international
# students, was fitted on a 67-response extract and is refitted on all 114 below).
f_brands <- as.formula(paste("y ~", paste(paste0("pts_", names(brands)), collapse = " + ")))
tidy_polr <- function(m, label) {
  ci <- suppressMessages(confint(m))
  co <- coef(summary(m))
  k <- length(coef(m))
  data.frame(model = label, term = names(coef(m)), estimate = unname(coef(m)),
             lower = ci[1:k, 1], upper = ci[1:k, 2],
             p = 2 * pnorm(-abs(co[1:k, "t value"])), row.names = NULL)
}
d$y <- factor(c(never = 2, former = 1, current = 3)[as.character(d$wear)], levels = 1:3, ordered = TRUE)
rep_all <- polr(f_brands, data = d, Hess = TRUE)
rep_chi <- polr(f_brands, data = d[d$segment == "chinese", ], Hess = TRUE)
rep_int <- polr(f_brands, data = d[d$segment == "international", ], Hess = TRUE)
cat("\n== As reported (used to < no < yes), all 220\n"); print(round(coef(rep_all), 4))
cat("== As reported, Chinese nationals (106)\n"); print(round(coef(rep_chi), 4))
cat("== As reported, international students, now all 114\n"); print(round(coef(rep_int), 4))
reported <- bind_rows(tidy_polr(rep_all, "reported_all"), tidy_polr(rep_chi, "reported_chinese"), tidy_polr(rep_int, "reported_international"))

# ---------------------------------------------------------------- 4 The regression, re-read
# Outcome in the order it means: never wore Vans < used to < wears them now.
d$y <- d$wear  # already ordered never < former < current
d$y <- factor(d$y, ordered = TRUE)
m_brands  <- polr(f_brands, data = d, Hess = TRUE)
f_context <- update(f_brands, . ~ . + skate + segment)
m_context <- polr(f_context, data = d, Hess = TRUE)
m_base    <- polr(y ~ skate + segment, data = d, Hess = TRUE)
cat("\n== Re-read: never < used to < currently, brands only\n"); print(round(coef(m_brands), 4))
cat("\n== Re-read, with skating and segment\n"); print(coef(summary(m_context)))
cat("\nAIC: brands only", round(AIC(m_brands), 1), "| with context", round(AIC(m_context), 1),
    "| context only", round(AIC(m_base), 1), "\n")
cat("Likelihood ratio test, do the six brand rankings add anything once skating and segment are in?\n")
lr <- anova(m_base, m_context)
print(lr)
cat("\nOdds ratios with 95% CI (with context):\n")
or <- tidy_polr(m_context, "reread_context") %>% mutate(OR = exp(estimate), OR_low = exp(lower), OR_high = exp(upper))
print(or %>% mutate(across(c(OR, OR_low, OR_high), ~ round(.x, 2)), p = round(p, 3)) %>% dplyr::select(term, OR, OR_low, OR_high, p))

# Proportional odds check: a multinomial model gives each outcome step its own coefficients.
# If its two sets of coefficients tell the same story as the ordinal one, the single-slope
# assumption is reasonable for a sample this size.
mn <- multinom(f_context, data = d, trace = FALSE)
cat("\nMultinomial check (log odds vs never): former / current rows\n"); print(round(coef(mn), 3))

# ---------------------------------------------------------------- 5 Figures and results
theme_site <- theme_minimal(base_size = 12) + theme(panel.grid.minor = element_blank(), plot.title.position = "plot")
pretty <- c(pts_nikesb = "Nike SB", pts_supreme = "Supreme", pts_adidas = "Adidas", pts_vans = "Vans", pts_converse = "Converse", pts_other = "Other brand",
            skateformer = "Used to skate (vs never)", skatecurrent = "Skates now (vs never)", segmentinternational = "International (vs Chinese national)")
plot_or <- or %>% mutate(term = factor(pretty[term], levels = rev(pretty)))
g <- ggplot(plot_or, aes(x = OR, y = term)) +
  geom_vline(xintercept = 1, colour = "#66665F", linetype = "dashed") +
  geom_errorbarh(aes(xmin = OR_low, xmax = OR_high), height = 0.2, colour = "#121211") +
  geom_point(size = 2.6, colour = "#FF4F00") +
  scale_x_log10() + theme_site +
  labs(title = "Who wears Vans? Odds ratios from the ordinal regression, re-read",
       subtitle = "Outcome: never wore Vans < used to < wears them now. 220 NYU Shanghai students, 2024.",
       x = "Odds ratio (log scale)", y = NULL)
ggsave("results/odds-ratios.png", g, width = 8, height = 4.6, dpi = 160, bg = "white")

g2 <- ggplot(reported %>% mutate(term = pretty[term], model = sub("reported_", "", model)), aes(x = term, y = estimate)) +
  geom_hline(yintercept = 0, colour = "#66665F", linetype = "dashed") +
  geom_errorbar(aes(ymin = lower, ymax = upper), width = 0.2) + geom_point() +
  facet_wrap(~ model) + theme_site + theme(axis.text.x = element_text(angle = 45, hjust = 1)) +
  labs(title = "The 2024 regression, reproduced (and refitted on all 114 international students)", x = NULL, y = "Coefficient (log odds)")
ggsave("results/as-reported.png", g2, width = 10, height = 4.8, dpi = 160, bg = "white")

write.csv(reported, "results/coefficients-as-reported.csv", row.names = FALSE)
write.csv(or, "results/odds-ratios-reread.csv", row.names = FALSE)
write.csv(assoc, "results/brand-association.csv", row.names = FALSE)
write.csv(as.data.frame(why), "results/reasons-by-group.csv", row.names = FALSE)
if (requireNamespace("jsonlite", quietly = TRUE)) {
  jsonlite::write_json(list(
    reported = reported, reread_brands = tidy_polr(m_brands, "reread_brands"), reread_context = or,
    aic = list(brands = AIC(m_brands), context = AIC(m_context), context_only = AIC(m_base)),
    lr_test = list(statistic = lr$`LR stat.`[2], df = as.integer(lr$`   Df`[2]), p = lr$`Pr(Chi)`[2]),
    multinom = as.data.frame(coef(mn))
  ), "results/results.json", digits = 6, pretty = TRUE)
}
cat("\nDone. Results are in results/.\n")
