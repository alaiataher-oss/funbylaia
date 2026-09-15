#!/usr/bin/env python3
"""Generate static/js/foodchain-words.js — run from repo root."""
from __future__ import annotations

import json
from pathlib import Path

RAW = r"""
apple apricot avocado banana blackberry blueberry cantaloupe cherry clementine coconut cranberry
date dragonfruit durian elderberry fig grape grapefruit guava honeydew jackfruit kiwi lemon lime
lychee mango melon nectarine orange papaya passionfruit peach pear persimmon pineapple plum
pomegranate pomelo raspberry strawberry tangerine watermelon boysenberry mulberry gooseberry
starfruit rambutan mangosteen plantain quince soursop ugli fruit blood orange mandarin navel orange
acai goji berry currant kumquat longan loquat sapodilla tamarind yuzu bergamot cactus pear prickly pear
artichoke arugula asparagus bamboo shoot bean sprout beet beetroot bell pepper bok choy broccoli
brussels sprout cabbage carrot cauliflower celery chard chili chili pepper chive collard corn cucumber
daikon edamame eggplant endive fennel garlic ginger green bean jalapeno kale leek lettuce mushroom
mustard greens okra onion parsnip pea pepper potato pumpkin radish shallot spinach squash sweet potato
tomato turnip watercress zucchini yam rutabaga kohlrabi scallion spring onion snap pea snow pea nori
seaweed kimchi sauerkraut pickle gherkin olive caper horseradish wasabi turmeric galangal lemongrass
cassava taro jicama lotus root bean lentil chickpea black bean kidney bean pinto bean navy bean soybean
tofu tempeh seitan bacon beef brisket burger chicken duck egg fish ham lamb meatball pork ribs sausage
steak turkey veal venison salmon tuna shrimp prawn crab lobster oyster mussel clam scallop squid octopus
anchovy sardine mackerel cod halibut trout eel caviar chicken wing chicken nugget hot dog pepperoni
salami prosciutto pastrami corned beef ground beef meatloaf pork chop lamb chop beef stew butter cheese
cheddar mozzarella parmesan brie gouda feta ricotta cream cream cheese sour cream yogurt greek yogurt
milk oat milk almond milk soy milk coconut milk whipped cream ice cream gelato custard pudding
cottage cheese blue cheese swiss cheese provolone camembert mascarpone paneer queso bagel baguette
bread brioche bun cereal ciabatta couscous cracker croissant crouton dumpling english muffin flatbread
focaccia french toast granola grits muffin naan noodle oatmeal pancake pasta pita pretzel quinoa ramen
rice risotto roll scone sourdough spaghetti toast tortilla waffle wheat barley oat rye cornmeal polenta
gnocchi lasagna macaroni penne fettuccine linguine udon soba vermicelli rice noodle fried rice rice cake
rice pudding porridge congee biscuit cookie graham cracker breadstick dinner roll hot dog bun hamburger bun
pizza taco burrito quesadilla nachos sushi sashimi tempura teriyaki curry stew soup salad sandwich wrap
kebab falafel hummus guacamole salsa pho pad thai bibimbap poke bowl acai bowl smoothie bowl omelette
frittata quiche casserole chili con carne shepherd pie pot pie meat pie apple pie pumpkin pie key lime pie
cheesecake tiramisu brownie cupcake donut doughnut eclair macaron parfait sundae milkshake smoothie shake
latte cappuccino espresso americano mocha matcha chai tea coffee hot chocolate cocoa juice lemonade
limeade orange juice apple juice soda cola root beer ginger ale sparkling water mineral water milk tea
bubble tea boba thai tea green tea black tea herbal tea kombucha beer wine champagne cider sangria
cocktail mocktail protein shake candy caramel chocolate chocolate bar chocolate chip cookie dough
cotton candy fudge gummy bear gummy jelly jelly bean licorice lollipop marshmallow nougat peanut brittle
popcorn pretzel stick potato chip tortilla chip trail mix granola bar energy bar protein bar fruit snack
dried mango dried apricot raisin prune nutella peanut butter almond butter jam marmalade honey syrup
maple syrup agave nut almond cashew pistachio walnut pecan hazelnut macadamia peanut chestnut
sunflower seed pumpkin seed chia seed flaxseed sesame ketchup mustard mayonnaise mayo aioli ranch
bbq sauce soy sauce fish sauce oyster sauce hoisin hot sauce sriracha tabasco vinegar balsamic olive oil
sesame oil vegetable oil coconut oil gravy stock broth bouillon miso dashi pesto marinara alfredo
carbonara hollandaise tartar sauce cocktail sauce chutney relish wasabi mayo garlic sauce cheese sauce
nacho cheese gyoza bao bao bun dim sum spring roll egg roll wonton wonton soup miso soup tom yum laksa
nasi goreng satay rendang sambal bulgogi galbi japchae tteokbokki banh mi summer roll lumpia pancit
adobo sinigang empanada arepa pupusa tamale enchilada fajita chimichanga tostada ceviche poutine pierogi
schnitzel bratwurst paella ravioli tortellini cannoli bruschetta caprese antipasto tapas mezze shawarma
gyro doner kofta biryani dal samosa pakora roti paratha chapati dosa idli vindaloo tikka tandoori masala
chai latte scrambled eggs fried egg poached egg boiled egg eggs benedict hash brown home fries avocado toast
peanut butter toast jam toast cereal bar yogurt parfait fruit salad overnight oats chia pudding banana bread
zucchini bread carrot cake coffee cake cinnamon roll danish pancake stack waffle cone crepe blintz
french toast sticks red apple green apple fuji apple gala apple honeycrisp roma tomato cherry tomato
grape tomato baby carrot baby corn baby spinach romaine iceberg lettuce butter lettuce red cabbage
napa cabbage chinese cabbage portobello shiitake enoki oyster mushroom button mushroom cremini truffle
white rice brown rice jasmine rice basmati rice sticky rice wild rice fried chicken roast chicken
grilled chicken chicken soup chicken salad tuna salad egg salad coleslaw potato salad macaroni salad
caesar salad greek salad cobb salad wedge salad garden salad fruit punch iced tea sweet tea horchata
agua fresca coconut water aloe juice tomato juice carrot juice celery juice beet juice wheatgrass
energy drink sports drink protein water apple crisp apple cobbler peach cobbler berry cobbler banana split
root beer float affogato panna cotta creme brulee flan tres leches baklava churro sopapilla mochi daifuku
taiyaki swiss roll roll cake pound cake sponge cake angel food cake red velvet black forest opera cake
napoleon profiterole cream puff beignet funnel cake soft serve frozen yogurt sorbet sherbet granita
popsicle ice pop paleta italian ice snow cone shaved ice halo halo espresso shot flat white cortado
macchiato irish coffee cold brew nitro coffee drip coffee pour over french press turkish coffee
vietnamese coffee egg coffee matcha latte hojicha genmaicha oolong earl grey english breakfast chamomile
peppermint tea ginger tea lemon tea honey lemon yuzu tea barley tea corn tea bubble milk tea taro milk tea
brown sugar milk tea cheese tea fruit tea green smoothie banana smoothie berry smoothie mango smoothie
pineapple smoothie coconut smoothie ramen noodles cup noodles instant noodles cupcake frosting whipped topping
pie crust pizza dough chocolate chip cookie oatmeal cookie peanut butter cookie sugar cookie shortbread
biscotti wafer ladyfinger madeleine financier cake pop sea salt caramel salted caramel butterscotch toffee
fudge brownie blondie lemon bar raspberry bar fig bar date roll energy ball protein ball overnight chia
rice bowl noodle bowl soup bowl salad bowl grain bowl buddha bowl power bowl burrito bowl taco salad
loaded fries cheese fries chili fries waffle fries sweet potato fries onion ring mozzarella stick
chicken tender fish stick corn dog sausage roll pot sticker soup dumpling xiao long bao char siu roast duck
peking duck orange chicken general tso sweet and sour kung pao mapo tofu dan dan noodles scallion pancake
egg tart pineapple bun milk bread garlic bread cheese bread cornbread banana muffin blueberry muffin bran muffin
anchovy paste apple cider apple sauce applesauce baba ganoush bagel chip baked bean baked potato baking powder
balsamic glaze barbecue basil bay leaf bean curd beef broth beef jerky berry biscuit gravy black coffee
black pepper black tea blood sausage blue cheese dressing bone broth bran brat bread pudding breakfast burrito
breakfast sausage brie cheese broccoli rabe brown butter brown sugar bubblegum buckwheat buffalo wing bulgur
butter chicken butter cookie buttermilk butternut squash cabbage roll cafe au lait cake calamari california roll
canadian bacon candy bar candy cane candy corn cannellini caramel apple caramel corn carrot stick cashew butter
cashew milk catfish cauliflower rice celery stick cereal milk ceviche bowl chai tea charcuterie cheddar cheese
cheese ball cheese curd cheese pizza cheese stick cheeseburger cherry pie cherry soda chicken burrito chicken curry
chicken katsu chicken rice chicken sandwich chicken taco chickpea salad chili dog chili oil chimichurri
chinese broccoli chipotle chocolate cake chocolate milk chocolate mousse chop suey chorizo chow mein chowder
ciabatta roll cinnamon cinnamon bun cinnamon toast clam chowder club sandwich cobbler cocoa powder coconut cream
coffee bean cola float condensed milk cooking oil coriander corn chip corn flake corn pudding corn tortilla
cornbread muffin cottage pie cotton candy stick couscous salad crab cake crab rangoon cranberry juice
cranberry sauce cream puff cream soda creamed corn crepe cake crispy chicken croissant sandwich cucumber salad
cucumber water curry paste curry rice custard tart cutlet daikon radish dal soup danish pastry dark chocolate
dashi broth date paste deli meat dessert deviled egg dijon mustard dill dill pickle doner kebab donut glaze
dragon fruit dressing dried cranberry drumstick duck confit dumpling soup edible flower egg drop soup egg noodle
egg salad sandwich eggnog eggplant parm elbow pasta elderflower empanada dough enchilada sauce energy drink can
english muffin bread espresso bean evaporated milk falafel wrap farro fennel seed fermented tofu feta cheese
fettuccine alfredo fig jam filet mignon fish and chips fish ball fish cake fish taco flan cake flat white coffee
flour flour tortilla focaccia bread fondue fortune cookie frankfurter freekeh french bread french fry
french onion soup fried dumpling fried egg sandwich fried fish fried noodle fried plantain fried shrimp fries
fritter frosting frozen banana frozen pizza fruit cake fruit cup fruit leather fruit tart fudge cake fusilli
galangal root garlic bread stick garlic knot garlic naan gelatin ghee ginger beer ginger cookie ginger snap
gnocchi pasta goat cheese goat milk golden delicious goulash graham granola cluster grape juice grapefruit juice
greek salad bowl green bean casserole green grape green onion green pepper grilled cheese grilled fish
grilled shrimp grits bowl ground pork guacamole dip guava juice gummy worm gyro wrap hamburger hash hazelnut spread
herb hoagie hoisin sauce honey bun honey cake honey mustard honeycomb hot chocolate mix hot sauce bottle hummus dip
ice ice cream cake ice cream cone ice tea icing idli sambar imitation crab indian curry instant coffee italian dressing
italian ice cup jalapeno popper jam donut jambalaya jelly donut jerky juice box kale chip kale salad katsu
katsu curry kebab skewer ketchup packet key lime kidney bean stew kimchi pancake kiwi fruit knife cut noodle
kombucha drink korean bbq kung pao chicken lamb kebab lamb stew lasagna sheet latte art leek soup lemon cake
lemon curd lemon juice lemon pie lemon soda lemon water lemonade stand lentil soup lettuce wrap lime juice lime pie
lime soda linguine pasta lobster bisque lobster roll lollipop candy london broil lo mein longan fruit lotus seed
lunch meat lychee juice mac and cheese macaron cookie mackerel fish madeleine cookie malt malted milk mango lassi
mango sticky rice maple bacon maple bar maple candy marinara sauce marmite marshmallow fluff matcha cake
matcha ice cream matzo mayonnaise jar meat meat sauce meatball sub melon soda meringue mexican rice milk bread loaf
milk chocolate milkshake cup millet mince minestrone mint mint chocolate mint tea miso glaze miso ramen mixed nuts
mocha latte mochi ice cream molasses mole sauce monterey jack mooncake mozzarella stick fried muesli muffin top
mulled wine mushroom soup mustard seed naan dip nacho chip nashi pear nectarine fruit nigiri noodle soup nori sheet
nut bar nutella crepe oatmeal cookie bar octopus salad oil olive oil bread omelet onion dip onion soup
orange chicken dish orange marmalade orange soda oreo oxtail oyster sauce dish pad see ew paella rice pancake mix
paneer tikka papaya salad parfait cup parmesan cheese parsley passion fruit pasta salad pastry pate peach juice
peach tea peanut sauce pear juice peas pecan pie penne pasta pepper jack pepperoni pizza pesto pasta pho soup
pickle spear pie pierogi plate pita chip pita pocket pizza slice plant milk plantain chip plum sauce poached salmon
poke polenta cake pomegranate juice pop tart popsicle stick pork belly pork bun pork dumpling pork ramen porridge bowl
potato chip bag potato wedge potstickers pound cake slice prawn cracker pretzel soft primavera protein bar chocolate
pudding cup puff pastry pulled pork pumpkin bread pumpkin latte pumpkin seed snack quesadilla cheese quinoa bowl
rabbit radish salad raisin bread ramen egg ranch dressing raspberry jam ravioli pasta red bean red bean paste
red curry red onion red pepper red velvet cake relish tray ribeye rice ball rice cracker rice paper risotto bowl
roast beef roast potato roasted almond roasted peanut rocket salad roll cake slice root vegetable rose tea rosemary
rye bread saffron sage sake salad dressing salami sandwich salmon bagel salmon sashimi salsa verde salt salted egg
samosa plate sandwich wrap sardine can sashimi plate sauce sausage gravy scallion oil scallop dish scone cream
seafood seafood pasta seasoning seaweed salad seed seitan steak sesame ball sesame chicken sesame seed shake bowl
shallot oil shaved beef sherbet cup shiitake soup short rib shortcake shrimp cocktail shrimp fried rice shrimp taco
sirloin skewer slider sloppy joe snack mix snow pea stir fry soda bread soda water soft pretzel som tum sorbet cup
sourdough bread soy soy sauce chicken spaghetti bolognese spam spam musubi sparkling juice spinach dip spinach salad
sponge cake slice spring mix sprite squash soup sriracha mayo steak frites steamed bun steamed fish sticky toffee
stir fry stock cube strawberry cake strawberry jam strawberry milk strawberry shortcake string cheese sub sandwich
sugar sugar snap pea sundae cup sunflower butter supper surf and turf sushi roll sweet bread sweet chili
sweet potato fry sweet roll swiss roll cake syrup bottle tabbouleh taco shell tagine tahini tamago tamarind paste
tapioca tapioca pudding tart tartar tea cake tea latte tempura shrimp tequila lime teriyaki chicken thai curry
thai iced tea thyme tikka masala toastie toffee pudding tofu bowl tomato basil tomato paste tomato sauce tomato soup
tonkatsu tonkotsu tortellini soup tortilla chip salsa tostada shell trail mix bag truffle fries truffle oil tuna melt
tuna poke turkey burger turkey sandwich tzatziki udon noodle ugali umeboshi vanilla vanilla cake vanilla ice cream
vanilla latte veal parmesan vegan burger vegetable broth vegetable curry vegetable soup veggie burger venison steak
vermicelli noodle vinaigrette vinegar chips waffle fry walnut bread water water chestnut watermelon juice
watermelon slice wheat bread wheat tortilla whey whipped butter white chocolate white rice bowl whole milk wiener
wild mushroom wine cooler wonton chip wrap sandwich yakitori yam fries yeast yellow curry yogurt drink yuzu dressing
zaatar ziti zucchini bread loaf zucchini fries zongzi
fried rice ice cream apple pie garlic bread peanut butter french fries onion rings ice tea soft serve
hot sauce soy milk oat milk almond milk green tea black tea milk tea bubble tea iced coffee cold brew
orange juice apple juice tomato soup chicken soup miso soup clam chowder egg drop fish and chips
mac and cheese grilled cheese peanut butter cookie chocolate chip cookie ice cream cone ice cream cake
"""

def parse(raw: str) -> list[str]:
    out: set[str] = set()
    for line in raw.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        for part in line.split():
            # multi-word handled by spaces in RAW as separate tokens - rejoin known phrases:
            pass
        # split on 2+ spaces groups already newline separated single tokens; multi-word are space-separated in line
        # Actually RAW uses spaces between all words, multi-word foods are written as separate tokens incorrectly.
        # Fix: treat each line as space-separated single-token foods only; multi-word are explicit in list with underscore then replace
    # Better approach: split RAW by whitespace for single words, plus explicit MULTI list
    singles = []
    stop = {
        "and", "or", "the", "a", "an", "of", "with", "in", "on", "to", "for", "au", "con", "see",
        "ew", "tso", "drop", "float", "shot", "press", "over", "brew", "white", "black", "red",
        "green", "yellow", "sweet", "sour", "hot", "cold", "soft", "hard", "french", "english",
        "italian", "greek", "thai", "indian", "chinese", "korean", "mexican", "vietnamese",
        "general", "angel", "devil", "power", "protein", "energy", "sports", "mineral", "sparkling",
        "whipped", "sour", "cream", "chip", "stick", "ring", "ball", "bar", "bowl", "cup", "bag",
        "can", "jar", "mix", "art", "loaf", "sheet", "top", "boat", "tray", "stand", "hole",
        "king", "paste", "powder", "root", "seed", "oil", "water", "ice", "salt", "sugar", "flour",
        "herb", "meat", "sauce", "soup", "salad", "cake", "pie", "tea", "coffee", "juice", "milk",
        "bread", "rice", "noodle", "pasta", "cheese", "bean", "berry", "pepper", "onion", "egg",
        "fish", "pork", "beef", "lamb", "duck", "chicken", "turkey", "shrimp", "crab", "toast",
        "roll", "bun", "fry", "fries", "stew", "curry", "wrap", "drink", "snack", "dessert",
        "breakfast", "dinner", "lunch", "supper", "dish", "plate", "slice", "stack", "cluster",
        "glaze", "icing", "frosting", "topping", "crust", "dough", "filling", "dressing", "gravy",
        "broth", "stock", "seasoning", "spice", "leaf", "greens", "sprout", "shoot", "fruit",
        "vegetable", "seafood", "dairy", "grain", "agua", "au", "la", "le", "de", "du", "des",
        "angel", "food", "key", "lime", "blood", "navel", "fuji", "gala", "roma", "baby",
        "button", "wild", "home", "hash", "loaded", "waffle", "string", "blue", "goat", "feta",
        "swiss", "brie", "cheddar", "cottage", "cream", "sour", "greek", "oat", "almond", "soy",
        "coconut", "cashew", "sunflower", "peanut", "maple", "sea", "salted", "brown", "white",
        "jasmine", "basmati", "sticky", "fried", "roast", "grilled", "poached", "boiled",
        "scrambled", "deviled", "baked", "steamed", "mashed", "pulled", "ground", "corned",
        "smoked", "cured", "pickled", "dried", "fresh", "frozen", "instant", "cup", "box",
        "packet", "bottle", "can", "tin", "bag", "bar", "bite", "pop", "cone", "cup",
    }
    # Real foods that would be wrongly stopped — allowlist
    allow = {
        "pie", "tea", "egg", "yam", "ham", "rye", "oat", "pea", "nut", "oil", "jam", "soy", "bao",
        "pho", "dal", "ale", "cola", "sake", "miso", "nori", "tofu", "udon", "soba", "mochi", "flan",
        "brie", "feta", "gouda", "date", "fig", "kiwi", "lime", "plum", "pear", "beet", "leek",
        "kale", "corn", "rice", "bean", "milk", "wine", "beer", "cider", "bread", "toast", "bagel",
        "pizza", "pasta", "ramen", "sushi", "taco", "salad", "soup", "stew", "curry", "sauce",
        "juice", "latte", "mocha", "chai", "boba", "fries", "candy", "cake", "cookie", "donut",
        "brownie", "fudge", "honey", "syrup", "butter", "cheese", "yogurt", "cream", "bacon",
        "steak", "burger", "waffle", "crepe", "nachos", "salsa", "hummus", "falafel", "kebab",
        "gyro", "biryani", "samosa", "dumpling", "wonton", "gyoza", "tempura", "teriyaki", "kimchi",
        "pretzel", "popcorn", "granola", "oatmeal", "pancake", "muffin", "scone", "croissant",
        "baguette", "focaccia", "ciabatta", "sourdough", "brioche", "naan", "pita", "tortilla",
        "quesadilla", "burrito", "enchilada", "fajita", "tamale", "arepa", "empanada", "pierogi",
        "schnitzel", "paella", "risotto", "lasagna", "ravioli", "cannoli", "tiramisu", "cheesecake",
        "cupcake", "macaron", "parfait", "sundae", "gelato", "sorbet", "sherbet", "popsicle",
        "smoothie", "milkshake", "espresso", "cappuccino", "americano", "matcha", "lemonade",
        "kombucha", "sangria", "champagne", "mocktail", "cocktail", "pepper", "onion", "tomato",
        "potato", "carrot", "garlic", "ginger", "basil", "mint", "thyme", "sage", "parsley",
        "shrimp", "salmon", "tuna", "crab", "lobster", "oyster", "mussel", "clam", "scallop",
        "chicken", "turkey", "duck", "pork", "beef", "lamb", "veal", "venison", "bacon", "sausage",
        "pepperoni", "salami", "prosciutto", "pastrami", "meatball", "meatloaf", "brisket", "ribs",
        "truffle", "olive", "pickle", "kimchi", "sauerkraut", "relish", "chutney", "pesto",
        "marinara", "alfredo", "carbonara", "hollandaise", "aioli", "mayo", "mayonnaise", "ketchup",
        "mustard", "ranch", "sriracha", "tabasco", "wasabi", "horseradish", "vinegar", "balsamic",
        "broth", "stock", "bouillon", "dashi", "gravy", "custard", "pudding", "mousse", "meringue",
        "caramel", "toffee", "butterscotch", "marshmallow", "nougat", "licorice", "lollipop",
        "gummy", "jelly", "jam", "marmalade", "nutella", "tahini", "hummus", "guacamole",
        "chips", "cracker", "crouton", "granola", "muesli", "porridge", "congee", "grits",
        "polenta", "couscous", "quinoa", "farro", "bulgur", "freekeh", "millet", "buckwheat",
        "noodles", "spaghetti", "macaroni", "penne", "fettuccine", "linguine", "fusilli", "ziti",
        "gnocchi", "dumpling", "wonton", "gyoza", "bao", "bun", "roll", "wrap", "sandwich",
        "burger", "hotdog", "slider", "sub", "hoagie", "panini", "toastie", "crepe", "blintz",
        "pancake", "waffle", "frenchtoast", "hashbrown", "omelette", "frittata", "quiche",
        "casserole", "lasagna", "risotto", "paella", "biryani", "pilaf", "friedrice",
        "water", "soda", "cola", "beer", "wine", "cider", "sake", "champagne", "sangria",
        "coffee", "espresso", "latte", "mocha", "cappuccino", "americano", "matcha", "chai",
        "boba", "kombucha", "smoothie", "milkshake", "lemonade", "limeade", "horchata",
        "apple", "banana", "orange", "grape", "mango", "peach", "pear", "plum", "cherry",
        "berry", "lemon", "lime", "melon", "papaya", "guava", "lychee", "durian", "coconut",
        "avocado", "tomato", "potato", "carrot", "onion", "garlic", "ginger", "spinach", "kale",
        "lettuce", "cabbage", "broccoli", "celery", "cucumber", "zucchini", "eggplant", "pumpkin",
        "squash", "corn", "pea", "bean", "lentil", "chickpea", "edamame", "mushroom", "truffle",
        "almond", "cashew", "walnut", "pecan", "pistachio", "hazelnut", "macadamia", "peanut",
        "chestnut", "raisin", "prune", "date", "fig", "currant", "caper", "olive", "pickle",
    }
    for tok in raw.replace("\n", " ").split():
        tok = tok.strip().lower()
        if len(tok) < 2 or not tok.isalpha():
            continue
        if tok in stop and tok not in allow:
            continue
        singles.append(tok)
    multi = [
        "ugli fruit", "blood orange", "navel orange", "goji berry", "cactus pear", "prickly pear",
        "bamboo shoot", "bean sprout", "bell pepper", "bok choy", "brussels sprout", "chili pepper",
        "green bean", "mustard greens", "sweet potato", "spring onion", "snap pea", "snow pea",
        "black bean", "kidney bean", "pinto bean", "navy bean", "chicken wing", "chicken nugget",
        "hot dog", "corned beef", "ground beef", "pork chop", "lamb chop", "beef stew", "cream cheese",
        "sour cream", "greek yogurt", "oat milk", "almond milk", "soy milk", "coconut milk",
        "whipped cream", "ice cream", "cottage cheese", "blue cheese", "swiss cheese", "english muffin",
        "french toast", "rice noodle", "fried rice", "rice cake", "rice pudding", "graham cracker",
        "dinner roll", "hot dog bun", "hamburger bun", "pad thai", "poke bowl", "acai bowl",
        "smoothie bowl", "chili con carne", "shepherd pie", "pot pie", "meat pie", "apple pie",
        "pumpkin pie", "key lime pie", "hot chocolate", "orange juice", "apple juice", "root beer",
        "ginger ale", "sparkling water", "mineral water", "milk tea", "bubble tea", "thai tea",
        "green tea", "black tea", "herbal tea", "protein shake", "chocolate bar", "chocolate chip",
        "cookie dough", "cotton candy", "gummy bear", "jelly bean", "peanut brittle", "pretzel stick",
        "potato chip", "tortilla chip", "trail mix", "granola bar", "energy bar", "protein bar",
        "fruit snack", "dried mango", "dried apricot", "peanut butter", "almond butter", "maple syrup",
        "sunflower seed", "pumpkin seed", "chia seed", "bbq sauce", "soy sauce", "fish sauce",
        "oyster sauce", "hot sauce", "tartar sauce", "cocktail sauce", "wasabi mayo", "garlic sauce",
        "cheese sauce", "nacho cheese", "bao bun", "spring roll", "egg roll", "wonton soup",
        "miso soup", "tom yum", "nasi goreng", "summer roll", "chai latte", "scrambled eggs",
        "fried egg", "poached egg", "boiled egg", "eggs benedict", "hash brown", "home fries",
        "avocado toast", "peanut butter toast", "jam toast", "cereal bar", "yogurt parfait",
        "fruit salad", "overnight oats", "chia pudding", "banana bread", "zucchini bread",
        "carrot cake", "coffee cake", "cinnamon roll", "pancake stack", "waffle cone",
        "french toast sticks", "red apple", "green apple", "fuji apple", "gala apple", "roma tomato",
        "cherry tomato", "grape tomato", "baby carrot", "baby corn", "baby spinach", "iceberg lettuce",
        "butter lettuce", "red cabbage", "napa cabbage", "chinese cabbage", "oyster mushroom",
        "button mushroom", "white rice", "brown rice", "jasmine rice", "basmati rice", "sticky rice",
        "wild rice", "fried chicken", "roast chicken", "grilled chicken", "chicken soup",
        "chicken salad", "tuna salad", "egg salad", "potato salad", "macaroni salad", "caesar salad",
        "greek salad", "cobb salad", "wedge salad", "garden salad", "fruit punch", "iced tea",
        "sweet tea", "coconut water", "aloe juice", "tomato juice", "carrot juice", "celery juice",
        "beet juice", "energy drink", "sports drink", "protein water", "apple crisp", "apple cobbler",
        "peach cobbler", "berry cobbler", "banana split", "root beer float", "creme brulee",
        "tres leches", "swiss roll", "roll cake", "pound cake", "sponge cake", "angel food cake",
        "red velvet", "black forest", "opera cake", "cream puff", "funnel cake", "soft serve",
        "frozen yogurt", "ice pop", "italian ice", "snow cone", "shaved ice", "halo halo",
        "espresso shot", "flat white", "irish coffee", "cold brew", "nitro coffee", "drip coffee",
        "pour over", "french press", "turkish coffee", "vietnamese coffee", "egg coffee",
        "matcha latte", "earl grey", "english breakfast", "peppermint tea", "ginger tea",
        "lemon tea", "honey lemon", "yuzu tea", "barley tea", "corn tea", "bubble milk tea",
        "taro milk tea", "brown sugar milk tea", "cheese tea", "fruit tea", "green smoothie",
        "banana smoothie", "berry smoothie", "mango smoothie", "pineapple smoothie", "coconut smoothie",
        "ramen noodles", "cup noodles", "instant noodles", "cupcake frosting", "whipped topping",
        "pie crust", "pizza dough", "chocolate chip cookie", "oatmeal cookie", "peanut butter cookie",
        "sugar cookie", "cake pop", "sea salt caramel", "salted caramel", "fudge brownie", "lemon bar",
        "raspberry bar", "fig bar", "date roll", "energy ball", "protein ball", "overnight chia",
        "rice bowl", "noodle bowl", "soup bowl", "salad bowl", "grain bowl", "buddha bowl",
        "power bowl", "burrito bowl", "taco salad", "loaded fries", "cheese fries", "chili fries",
        "waffle fries", "sweet potato fries", "onion ring", "mozzarella stick", "chicken tender",
        "fish stick", "corn dog", "sausage roll", "pot sticker", "soup dumpling", "xiao long bao",
        "char siu", "roast duck", "peking duck", "orange chicken", "general tso", "sweet and sour",
        "kung pao", "mapo tofu", "dan dan noodles", "scallion pancake", "egg tart", "pineapple bun",
        "milk bread", "garlic bread", "cheese bread", "banana muffin", "blueberry muffin", "bran muffin",
        "french fries", "ice tea", "soft serve", "hot sauce", "fish and chips", "mac and cheese",
        "grilled cheese", "ice cream cone", "ice cream cake", "tomato soup", "chicken soup",
        "clam chowder", "egg drop", "peanut butter cookie", "chocolate chip cookie",
        "garlic bread stick", "cream cheese", "sour cream", "cottage cheese", "blue cheese",
        "string cheese", "cheddar cheese", "goat cheese", "feta cheese", "parmesan cheese",
        "cream puff", "pound cake", "carrot cake", "coffee cake", "sponge cake", "fruit cake",
        "cheese pizza", "pepperoni pizza", "chicken sandwich", "turkey sandwich", "club sandwich",
        "egg salad sandwich", "tuna melt", "grilled cheese", "hot dog", "corn dog", "chili dog",
        "cheese stick", "onion ring", "potato chip", "tortilla chip", "pita chip", "bagel chip",
        "green tea", "black tea", "milk tea", "thai tea", "ginger tea", "lemon tea", "mint tea",
        "matcha latte", "vanilla latte", "pumpkin latte", "chai latte", "mocha latte",
        "orange juice", "apple juice", "grape juice", "cranberry juice", "pomegranate juice",
        "watermelon juice", "guava juice", "peach juice", "pear juice", "carrot juice", "celery juice",
        "tomato juice", "aloe juice", "sparkling water", "soda water", "coconut water",
        "peanut butter", "almond butter", "cashew butter", "sunflower butter", "maple syrup",
        "soy sauce", "fish sauce", "oyster sauce", "hot sauce", "bbq sauce", "ranch dressing",
        "italian dressing", "salad dressing", "tartar sauce", "cocktail sauce", "marinara sauce",
        "alfredo", "cheese sauce", "nacho cheese", "garlic sauce", "plum sauce", "hoisin sauce",
        "fried rice", "sticky rice", "white rice", "brown rice", "jasmine rice", "basmati rice",
        "wild rice", "mexican rice", "chicken rice", "mango sticky rice", "rice pudding",
        "ice cream", "gelato", "soft serve", "frozen yogurt", "ice cream cake", "ice cream cone",
        "mochi ice cream", "matcha ice cream", "vanilla ice cream", "root beer float",
        "apple pie", "pumpkin pie", "key lime pie", "cherry pie", "pecan pie", "lemon pie", "lime pie",
        "pot pie", "meat pie", "shepherd pie", "cottage pie", "pot sticker", "spring roll",
        "egg roll", "summer roll", "bao bun", "soup dumpling", "wonton soup", "miso soup",
        "tomato soup", "chicken soup", "mushroom soup", "onion soup", "lentil soup", "noodle soup",
        "egg drop soup", "french onion soup", "vegetable soup", "minestrone", "tom yum", "pho soup",
        "clam chowder", "lobster bisque", "bone broth", "beef broth", "vegetable broth",
        "caesar salad", "greek salad", "cobb salad", "garden salad", "fruit salad", "pasta salad",
        "potato salad", "egg salad", "tuna salad", "chicken salad", "kale salad", "spinach salad",
        "seaweed salad", "cucumber salad", "radish salad", "octopus salad", "chickpea salad",
        "avocado toast", "french toast", "cinnamon toast", "garlic bread", "cheese bread",
        "milk bread", "sourdough bread", "rye bread", "wheat bread", "banana bread", "zucchini bread",
        "pumpkin bread", "walnut bread", "raisin bread", "cornbread", "soda bread", "pita pocket",
        "english muffin", "dinner roll", "ciabatta roll", "cinnamon roll", "sweet roll",
        "hamburger bun", "hot dog bun", "pineapple bun", "honey bun", "bagel", "croissant",
        "cinnamon bun", "pain au chocolat", "cronut", "beignet", "churro", "funnel cake",
        "mozzarella stick", "jalapeno popper", "onion ring", "chicken tender", "fish stick",
        "chicken wing", "buffalo wing", "chicken nugget", "corn dog", "pig in a blanket",
        "loaded fries", "cheese fries", "chili fries", "truffle fries", "waffle fries",
        "sweet potato fries", "yam fries", "zucchini fries", "hash brown", "home fries",
        "baked potato", "mashed potato", "roast potato", "potato wedge", "french fry",
        "soft pretzel", "pretzel stick", "cheese ball", "string cheese", "cheese curd",
        "cream cheese", "cottage cheese", "blue cheese", "goat cheese", "feta cheese",
        "cheddar cheese", "swiss cheese", "brie cheese", "parmesan cheese", "pepper jack",
        "monterey jack", "nacho cheese", "queso", "paneer", "paneer tikka", "butter chicken",
        "tikka masala", "yellow curry", "red curry", "thai curry", "indian curry", "vegetable curry",
        "chicken curry", "katsu curry", "curry rice", "fried chicken", "orange chicken",
        "sesame chicken", "teriyaki chicken", "kung pao chicken", "general tso", "mapo tofu",
        "dan dan noodles", "lo mein", "chow mein", "pad thai", "pad see ew", "pho", "ramen",
        "udon noodle", "soba", "vermicelli noodle", "knife cut noodle", "ramen noodles",
        "cup noodles", "instant noodles", "macaroni", "mac and cheese", "spaghetti bolognese",
        "fettuccine alfredo", "penne pasta", "pesto pasta", "seafood pasta", "lasagna",
        "ravioli pasta", "tortellini soup", "gnocchi pasta", "carbonara", "primavera",
        "california roll", "sushi roll", "sashimi plate", "nigiri", "tempura shrimp",
        "shrimp cocktail", "shrimp taco", "shrimp fried rice", "fish taco", "fish and chips",
        "fish cake", "fish ball", "lobster roll", "crab cake", "crab rangoon", "clam chowder",
        "beef stew", "lamb stew", "beef jerky", "pulled pork", "pork belly", "pork bun",
        "pork dumpling", "pork ramen", "short rib", "filet mignon", "ribeye", "sirloin",
        "roast beef", "corned beef", "ground beef", "ground pork", "meatball sub", "sloppy joe",
        "cheeseburger", "hamburger", "turkey burger", "veggie burger", "vegan burger",
        "breakfast burrito", "breakfast sausage", "scrambled eggs", "fried egg", "poached egg",
        "boiled egg", "deviled egg", "eggs benedict", "egg tart", "egg drop soup", "egg noodle",
        "egg salad", "egg coffee", "tofu scramble", "tempeh", "seitan steak", "veggie burger",
        "acai bowl", "smoothie bowl", "buddha bowl", "poke bowl", "grain bowl", "power bowl",
        "burrito bowl", "rice bowl", "noodle bowl", "soup bowl", "salad bowl",
        "milkshake", "smoothie", "protein shake", "banana smoothie", "berry smoothie",
        "mango smoothie", "green smoothie", "pineapple smoothie", "coconut smoothie",
        "bubble tea", "milk tea", "thai tea", "taro milk tea", "brown sugar milk tea",
        "matcha latte", "chai latte", "vanilla latte", "pumpkin latte", "mocha latte",
        "flat white", "cold brew", "nitro coffee", "iced coffee", "irish coffee", "turkish coffee",
        "vietnamese coffee", "egg coffee", "hot chocolate", "root beer", "ginger ale",
        "cream soda", "orange soda", "lemon soda", "lime soda", "cherry soda", "cola",
        "sparkling water", "soda water", "mineral water", "coconut water", "aloe juice",
        "pain au chocolat", "pig in a blanket", "general tso", "sweet and sour", "surf and turf",
        "fish and chips", "mac and cheese", "chips and dip", "bread and butter",
    ]
    out = set(singles) | { " ".join(m.lower().split()) for m in multi }
    # drop junk
    junk = {"and", "or", "the", "a", "an", "of", "with", "in", "on", "to", "for", "dish", "plate", "cup", "bag", "can", "mix", "jar", "bottle", "packet", "stand", "art", "loaf", "sheet", "stick", "hole", "top", "boat", "tray", "cooler", "king", "powder", "paste", "seed", "root", "oil", "water", "ice", "salt", "sugar", "flour", "herb", "meat", "sauce", "soup", "salad", "cake", "pie", "tea", "coffee", "juice", "milk", "bread", "rice", "noodle", "pasta", "cheese", "bean", "berry", "pepper", "onion", "egg", "fish", "pork", "beef", "lamb", "duck", "chicken", "turkey", "shrimp", "crab", "toast", "roll", "bun", "chip", "fry", "fries", "stew", "curry", "wrap", "bowl", "bar", "ball", "ring", "wing", "nugget", "tender", "dog", "burger", "sandwich", "pizza", "taco", "burrito", "salad", "smoothie", "latte", "shake", "soda", "drink", "snack", "dessert", "breakfast", "dinner", "lunch", "supper"}
    # keep short food words that are valid even if in junk - actually junk was too aggressive
    # Don't filter junk singles that are real foods
    keep_short = {"pie","tea","egg","yam","ham","rye","oat","pea","nut","oil","jam","soy","bao","pho","dal","rum","gin","ale","cola","sake","miso","nori","tofu","udon","soba","mochi","flan","brie","feta","gouda","date","fig","kiwi","lime","plum","pear","beet","leek","kale","corn","rice","bean","nuts","seed","milk","wine","beer","cider","bread","toast","bagel","pizza","pasta","ramen","sushi","taco","salad","soup","stew","curry","sauce","juice","latte","mocha","chai","boba","fries","chips","candy","cake","cookie","donut","brownie","fudge","honey","syrup","butter","cheese","yogurt","cream","bacon","steak","burger","hotdog","waffle","crepe","nachos","salsa","guac","hummus","falafel","kebab","gyro","biryani","samosa","dumpling","wonton","gyoza","tempura","teriyaki","kimchi","pickles","pretzel","popcorn","granola","oatmeal","pancake","muffin","scone","croissant","baguette","focaccia","ciabatta","sourdough","brioche","naan","pita","tortilla","quesadilla","burrito","enchilada","fajita","tamale","arepa","empanada","pierogi","schnitzel","paella","risotto","lasagna","ravioli","cannoli","tiramisu","cheesecake","brownie","cupcake","macaron","parfait","sundae","gelato","sorbet","sherbet","popsicle","smoothie","milkshake","espresso","cappuccino","americano","matcha","lemonade","limeade","kombucha","sangria","champagne","mocktail","cocktail"}
    cleaned = sorted(w for w in out if len(w) >= 2)
    return cleaned


def main() -> None:
    words = parse(RAW)
    # ensure letter bridging density: for each end letter, need starts
    root = Path(__file__).resolve().parents[1]
    out = root / "static" / "js" / "foodchain-words.js"
    lines = [
        "/** English food & drink dictionary for Food Chain 60 — edit freely. */\n",
        "export const FOOD_WORDS = [\n",
    ]
    for w in words:
        lines.append(f"  {json.dumps(w)},\n")
    lines.append("];\n\n")
    lines.append("/** @type {Set<string>} */\n")
    lines.append("export const FOOD_SET = new Set(FOOD_WORDS);\n")
    out.write_text("".join(lines), encoding="utf-8")
    print(f"Wrote {len(words)} words → {out}")


if __name__ == "__main__":
    main()
