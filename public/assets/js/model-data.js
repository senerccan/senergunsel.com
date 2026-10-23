// The playable model's inputs: the same numbers as the Excel workbook (Retail Model Playground v17).
// Every cost and store figure is illustrative and anonymized. Street traffic: City of Melbourne Open Data,
// pedestrian counts from 23 August 2024 to 22 August 2026, the 78 sensors used in the Tableau dashboard.
// Generated from the workbook's spec, so edit the workbook first and regenerate rather than editing by hand.

export const TIERS = ["SPLUS","S","D"];
export const TIER_NAME = {"SPLUS":"Flagship","S":"Standard","D":"Small"};
export const AREA = {"SPLUS":3400,"S":1650,"D":900};
export const RECIPES = ["Lean","Balanced","Showcase"];
export const RECIPE_LETTER = {"Lean":"L","Balanced":"B","Showcase":"S"};
export const BUCKETS = ["Build","Tech","Design","Business"];

// driver: ft2 ($ per ft², times the store's area), store ($ per store), format ($ once, with the first store
// of a size), pct (a share of the store's live Build and Tech lines). group: how the cost falls as the
// rollout grows. codes: the recipes that include the line, per size (L Lean, B Balanced, S Showcase).
export const ITEMS = [
  {"id":"BLD-01","bucket":"Build","name":"Site preparation and strip-out","driver":"ft2","group":"Learning","vals":{"SPLUS":9,"S":10,"D":11},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BLD-02","bucket":"Build","name":"Flooring","driver":"ft2","group":"Price breaks","vals":{"SPLUS":24,"S":23,"D":23},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BLD-03","bucket":"Build","name":"Walls, ceilings and joinery","driver":"ft2","group":"Learning","vals":{"SPLUS":40,"S":42,"D":44},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BLD-04","bucket":"Build","name":"Electrical and data cabling","driver":"ft2","group":"Learning","vals":{"SPLUS":21,"S":22,"D":23},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BLD-05","bucket":"Build","name":"Air conditioning and fire protection","driver":"ft2","group":"None","vals":{"SPLUS":27,"S":28,"D":29},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BLD-06","bucket":"Build","name":"Lighting","driver":"ft2","group":"Price breaks","vals":{"SPLUS":15,"S":14,"D":14},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BLD-07","bucket":"Build","name":"Fixtures and display system","driver":"ft2","group":"Price breaks","vals":{"SPLUS":24,"S":23,"D":23},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BLD-08","bucket":"Build","name":"Bespoke fixture upgrade","driver":"ft2","group":"Price breaks","vals":{"SPLUS":8,"S":8,"D":7},"codes":{"SPLUS":"BS","S":"BS","D":"BS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BLD-09","bucket":"Build","name":"Premium finishes (stone, timber, metalwork)","driver":"ft2","group":"Price breaks","vals":{"SPLUS":18,"S":16,"D":15},"codes":{"SPLUS":"S","S":"S","D":"S"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BLD-10","bucket":"Build","name":"Fitting rooms and back of house","driver":"store","group":"Learning","vals":{"SPLUS":46000,"S":33000,"D":18000},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BLD-11","bucket":"Build","name":"Storefront and exterior signage","driver":"store","group":"None","vals":{"SPLUS":60000,"S":46000,"D":36000},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"TEC-01","bucket":"Tech","name":"Feature LED wall","driver":"store","group":"Price breaks","vals":{"SPLUS":170000,"S":104000,"D":58000},"codes":{"SPLUS":"BS","S":"BS","D":"BS"},"kw":{"SPLUS":6.0,"S":3.2,"D":1.8},"zones":{"SPLUS":2,"S":1,"D":1},"hw":true},
  {"id":"TEC-02","bucket":"Tech","name":"Projection package (lower-cost screen)","driver":"store","group":"Price breaks","vals":{"SPLUS":52000,"S":34000,"D":24000},"codes":{"SPLUS":"L","S":"L","D":"L"},"kw":{"SPLUS":1.6,"S":1.2,"D":0.9},"zones":{"SPLUS":2,"S":1,"D":1},"hw":true},
  {"id":"TEC-03","bucket":"Tech","name":"Immersive LED room","driver":"store","group":"Price breaks","vals":{"SPLUS":156000,"S":72000,"D":0},"codes":{"SPLUS":"S","S":"S","D":"-"},"kw":{"SPLUS":7.0,"S":3.4,"D":0},"zones":{"SPLUS":3,"S":2,"D":0},"hw":true},
  {"id":"TEC-04","bucket":"Tech","name":"Exterior facade screen","driver":"store","group":"Price breaks","vals":{"SPLUS":94000,"S":56000,"D":30000},"codes":{"SPLUS":"S","S":"S","D":"S"},"kw":{"SPLUS":4.0,"S":2.4,"D":1.3},"zones":{"SPLUS":1,"S":1,"D":1},"hw":true},
  {"id":"TEC-05","bucket":"Tech","name":"Interactive displays and kiosks","driver":"store","group":"Price breaks","vals":{"SPLUS":58000,"S":30000,"D":16000},"codes":{"SPLUS":"BS","S":"BS","D":"S"},"kw":{"SPLUS":1.2,"S":0.6,"D":0.3},"zones":{"SPLUS":1,"S":1,"D":1},"hw":true},
  {"id":"TEC-06","bucket":"Tech","name":"People counting and dwell sensors","driver":"store","group":"Price breaks","vals":{"SPLUS":13000,"S":8000,"D":5000},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0.1,"S":0.06,"D":0.04},"zones":{"SPLUS":0,"S":0,"D":0},"hw":true},
  {"id":"TEC-07","bucket":"Tech","name":"Media players and edge computing","driver":"store","group":"Price breaks","vals":{"SPLUS":22000,"S":12000,"D":7000},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0.8,"S":0.4,"D":0.25},"zones":{"SPLUS":0,"S":0,"D":0},"hw":true},
  {"id":"TEC-08","bucket":"Tech","name":"Audio system","driver":"store","group":"Price breaks","vals":{"SPLUS":17000,"S":9000,"D":5000},"codes":{"SPLUS":"LBS","S":"BS","D":"BS"},"kw":{"SPLUS":0.6,"S":0.3,"D":0.15},"zones":{"SPLUS":0,"S":0,"D":0},"hw":true},
  {"id":"TEC-09","bucket":"Tech","name":"Network, wifi and security","driver":"store","group":"Price breaks","vals":{"SPLUS":15000,"S":11000,"D":9000},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0.2,"S":0.12,"D":0.1},"zones":{"SPLUS":0,"S":0,"D":0},"hw":true},
  {"id":"TEC-10","bucket":"Tech","name":"Point of sale and clienteling devices","driver":"store","group":"Price breaks","vals":{"SPLUS":16000,"S":10000,"D":7000},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0.2,"S":0.12,"D":0.08},"zones":{"SPLUS":0,"S":0,"D":0},"hw":true},
  {"id":"TEC-11","bucket":"Tech","name":"Systems integration and commissioning","driver":"store","group":"Learning","vals":{"SPLUS":66000,"S":44000,"D":28000},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"DES-01","bucket":"Design","name":"Local design adaptation and drawings","driver":"store","group":"Learning","vals":{"SPLUS":36000,"S":28000,"D":18000},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"DES-02","bucket":"Design","name":"Opening content pack","driver":"store","group":"Learning","vals":{"SPLUS":30000,"S":16000,"D":9000},"codes":{"SPLUS":"LBS","S":"BS","D":"BS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BIZ-01","bucket":"Business","name":"Permits, surveys and landlord fees","driver":"store","group":"None","vals":{"SPLUS":24000,"S":16000,"D":13000},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BIZ-02","bucket":"Business","name":"Hiring and training before opening","driver":"store","group":"Learning","vals":{"SPLUS":44000,"S":30000,"D":16000},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BIZ-03","bucket":"Business","name":"Opening campaign and launch event","driver":"store","group":"None","vals":{"SPLUS":70000,"S":34000,"D":18000},"codes":{"SPLUS":"LBS","S":"BS","D":"BS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BIZ-04","bucket":"Business","name":"Project management (share of build + tech)","driver":"pct","group":"Learning","vals":{"SPLUS":0.07,"S":0.07,"D":0.07},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"BIZ-05","bucket":"Business","name":"Contingency (share of build + tech)","driver":"pct","group":"Learning","vals":{"SPLUS":0.08,"S":0.08,"D":0.08},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"ONE-01","bucket":"Design","name":"Format concept and experience design","driver":"format","group":"None","vals":{"SPLUS":168000,"S":86000,"D":46000},"codes":{"SPLUS":"LBS","S":"LBS","D":"LBS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"ONE-02","bucket":"Design","name":"Prototype and mock-up testing","driver":"format","group":"None","vals":{"SPLUS":52000,"S":31000,"D":19000},"codes":{"SPLUS":"BS","S":"BS","D":"BS"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false},
  {"id":"ONE-03","bucket":"Design","name":"Signature artist installation","driver":"format","group":"None","vals":{"SPLUS":115000,"S":48000,"D":0},"codes":{"SPLUS":"S","S":"S","D":"-"},"kw":{"SPLUS":0,"S":0,"D":0},"zones":{"SPLUS":0,"S":0,"D":0},"hw":false}
];
export const PROGRAM_ITEMS = [{"id":"PRG-01","bucket":"Tech","name":"Content management platform setup","value":118000},{"id":"PRG-02","bucket":"Tech","name":"Footfall and analytics dashboards","value":56000},{"id":"PRG-03","bucket":"Tech","name":"Integration platform and data connections","value":74000},{"id":"PRG-04","bucket":"Design","name":"Brand experience playbook","value":46000},{"id":"PRG-05","bucket":"Business","name":"Program office setup and hiring","value":62000}];

export const SCALE_PRESETS = {"Cautious":{"lr":0.95,"floor":0.8,"share":0.25,"disc":[0.02,0.04,0.06,0.08],"lic_disc":0.0},"Expected":{"lr":0.9,"floor":0.7,"share":0.5,"disc":[0.03,0.07,0.1,0.14],"lic_disc":0.1},"Aggressive":{"lr":0.85,"floor":0.6,"share":0.75,"disc":[0.05,0.09,0.13,0.17],"lic_disc":0.2}};
export const PRICE_BREAK_AT = [3,8,15,30];
export const ECON = {"ticket":80,"conversion":0.2,"capture":0.03,"payback_years":3,"dash_margin":0.25,"gross_margin":0.6,"flagship_bar":12000,"standard_bar":5000,"ramp1":0.75,"ramp2":0.92,"open_year_share":0.5,"build_inflation":0.03,"discount_rate":0.1};
export const VARIABLE_COSTS = [0.02,0.013,0.007,0.015,0.015];
export const RUNNING = {"rent_psf":85,"rent_elasticity":0.55,"fte":{"SPLUS":8.0,"S":5.0,"D":3.5},"fte_cost":48000,"other_occ_psf":9,"kwh_psf":12,"hours":13,"days":360,"kwh_price":0.16,"support_pct":0.06,"refresh_share":0.65,"refresh_life":6,"content_per_zone":6000,"licence_steps":[[1,16000],[6,12500],[16,9500],[41,7000]],"licence_factor":{"SPLUS":1.5,"S":1.0,"D":0.6},"stock_weeks":7,"capacity_psf":{"SPLUS":1600,"S":1400,"D":1200}};
export const PROGRAM_RUNNING = {"central_team":1000000,"platform":60000,"stores_per_tech":8,"tech_cost":88000,"stores_per_manager":10,"manager_cost":120000};
export const STREET_CAPTURE = {"Destination Retail":1.2,"Evening / Entertainment":1.1,"CBD Core / All-Day":1.0,"Low Activity":0.8,"Office / Weekday Core":0.7,"Transit Spine":0.6,"Commuter Corridor":0.5};
export const OPENINGS = [2,4,6,8,10,0,0,0];
export const OWN_MIX = {"SPLUS":0.3,"S":0.5,"D":0.2};
export const YEARS = 10;

// The 78 street sensors, by sensor id: id, label, kind of street, people on an average day, people a year.
export const STREETS = [
  [2,"Bourke Street Mall (South)","Destination Retail",14524.6446,5496115],
  [3,"Melbourne Central","Evening / Entertainment",25912.5489,9874966],
  [4,"Town Hall (West)","Destination Retail",35110.4131,13342665],
  [5,"Princes Bridge","Destination Retail",24257.6817,9573477],
  [6,"Flinders Underpass - Myki Barriers","Commuter Corridor",10873.5208,3537575],
  [8,"Webb Bridge","CBD Core / All-Day",5842.9864,2040494],
  [9,"Southern Cross Station","Commuter Corridor",16648.0135,4605348],
  [10,"Victoria Point","Commuter Corridor",2678.1168,873485],
  [11,"Docklands Waterfront City Building Side","Evening / Entertainment",2853.5786,1175261],
  [12,"New Quay","Destination Retail",4730.5842,1899550],
  [14,"Sandridge Bridge","Transit Spine",8328.1128,2960814],
  [17,"Collins Place (South)","Commuter Corridor",10836.0231,3260646],
  [18,"Collins Place (North)","Commuter Corridor",7045.3662,2014287],
  [19,"Chinatown-Swanston St (North)","Evening / Entertainment",12156.6386,4809096],
  [20,"Chinatown-Lt Bourke St (South)","Evening / Entertainment",7421.5951,3093772],
  [21,"155-161 Russell Street","Destination Retail",9121.763,3551533],
  [23,"Spencer St-Collins St (South)","Office / Weekday Core",9666.3836,3051479],
  [24,"Spencer St-Collins St (North)","Commuter Corridor",23857.6697,7888311],
  [25,"Melbourne Convention Exhibition Centre","Transit Spine",15077.8416,6091250],
  [27,"QV Market-Peel St","Destination Retail",3266.0842,1337736],
  [28,"The Arts Centre","Transit Spine",16698.4524,6301658],
  [29,"St Kilda Rd-Alexandra Gardens","Destination Retail",8186.6374,3358011],
  [30,"Lonsdale St (South)","Evening / Entertainment",9317.6577,3749331],
  [31,"Lygon St (West)","Evening / Entertainment",4371.8195,1837186],
  [35,"Southbank Promenade","Destination Retail",30618.9132,11551576],
  [36,"Queen St (West)","Office / Weekday Core",5832.4095,1991270],
  [40,"Lonsdale St-Spring St (West)","Office / Weekday Core",5982.1964,1983547],
  [41,"Flinders La-Swanston St (West)","Transit Spine",35488.4022,13136999],
  [42,"Grattan St-Swanston St (West)","Office / Weekday Core",5726.2833,1673746],
  [43,"Monash Rd-Swanston St (West)","Office / Weekday Core",4688.3408,1400393],
  [44,"Tin Alley-Swanston St (West)","Office / Weekday Core",2253.4091,703448],
  [45,"Little Collins St-Swanston St (East)","Destination Retail",17931.9928,6855611],
  [47,"Melbourne Central-Elizabeth St (East)","Transit Spine",20906.6564,7828789],
  [49,"QVM-Therry St (South)","Destination Retail",8177.4432,3220391],
  [50,"Faraday St-Lygon St (West)","Destination Retail",4986.3581,1956080],
  [51,"QVM-Franklin St (North)","Destination Retail",2763.959,1050313],
  [52,"Elizabeth St-Lonsdale St (South)","CBD Core / All-Day",8726.0631,3247284],
  [53,"Collins Street (North)","CBD Core / All-Day",14395.5129,5072595],
  [54,"Lincoln-Swanston (West)","Commuter Corridor",4611.4277,1520649],
  [56,"Lonsdale St - Elizabeth St (North)","Evening / Entertainment",9997.8258,3772690],
  [58,"Bourke St - Spencer St (North)","Commuter Corridor",17115.5811,5854191],
  [59,"Building 80 RMIT","Office / Weekday Core",20434.8585,6477460],
  [61,"RMIT Building 14","Office / Weekday Core",13965.9682,4655085],
  [62,"La Trobe St (North)","CBD Core / All-Day",6942.6161,2520460],
  [63,"231 Bourke St","CBD Core / All-Day",10253.0121,3804040],
  [65,"Swanston St - City Square","Transit Spine",20151.0137,7457528],
  [66,"QV2 Apartments, 300 Swanston Street","CBD Core / All-Day",28747.1036,10696260],
  [67,"Flinders Ln -Degraves St (South)","CBD Core / All-Day",12642.5876,4445608],
  [68,"Flinders Ln -Degraves St (North)","CBD Core / All-Day",7584.1029,2701299],
  [69,"Flinders Ln -Degraves St (Crossing)","Transit Spine",5679.463,2039914],
  [70,"Errol Street (East)","CBD Core / All-Day",3984.4084,1447888],
  [71,"Westwood Place","Low Activity",660.9524,201640],
  [72,"Flinders St- ACMI","Transit Spine",7746.9544,2790403],
  [76,"Macaulay Rd- Bellair St","Low Activity",1675.6491,576202],
  [77,"Harbour Esplanade (West) - Pedestrian path","Evening / Entertainment",4576.7773,1795590],
  [78,"Harbour Esplanade (West) - Bike Path","Low Activity",1642.6706,612359],
  [79,"Flinders St (South)","Destination Retail",12555.6682,4715990],
  [84,"Elizabeth St - Flinders St (East) - New footpath","Transit Spine",29323.7766,10518309],
  [85,"Macaulay Rd (North)","Transit Spine",2423.2949,856791],
  [86,"Queensberry St - Errol St (South)","Low Activity",1534.0307,546500],
  [87,"Errol St (West)","CBD Core / All-Day",2815.7091,998978],
  [107,"Royal Mint 280 William St","Office / Weekday Core",4057.3229,1373849],
  [108,"William St - Little Lonsdale St (West)","Commuter Corridor",13385.9079,3908858],
  [109,"La Trobe St- William St (South)","Commuter Corridor",5146.867,1620185],
  [117,"114 Flinders Street Car Park Footpath","Transit Spine",5555.7995,1998792],
  [131,"I-Hub Corner of King Street and Flinders Street (2-6 King)","Destination Retail",3710.4008,1426881],
  [132,"I-Hub Corner of King Street and Latrobe Street (317-335 King)","CBD Core / All-Day",4375.6103,1578724],
  [133,"I-Hub Southern Cross Station - Lonsdale Street Entrance - South","CBD Core / All-Day",15983.4518,5616371],
  [134,"I-Hub Southern Cross Station - Bourke Street Entrance - North","CBD Core / All-Day",12553.405,4493666],
  [135,"I-Hub Southern Cross Station - Bourke Street Entrance - South","CBD Core / All-Day",11439.0252,4172608],
  [139,"COM Pole 1647 - Sandridge Bridge Signal Box","Commuter Corridor",2380.4551,764003],
  [141,"Awning of Nationwide Parking 474 Flinders Street","Destination Retail",4326.2965,1661859],
  [143,"Mounted on Toilet - Spencer Street, Batman Park","Destination Retail",6570.7863,2651347],
  [162,"iHub 489 Elizabeth Street","Destination Retail",11003.6936,4371980],
  [164,"I-Hub 526 La Trobe Street (Footpath)","CBD Core / All-Day",2964.4325,1050155],
  [165,"475 Spencer Street","Low Activity",1156.3609,409975],
  [167,"I-Hub 526 La Trobe Street (Crossing)","Low Activity",1254.8062,446264],
  [209,"Flinders Underpass - Walkway","CBD Core / All-Day",16887.7543,6219798]
];
