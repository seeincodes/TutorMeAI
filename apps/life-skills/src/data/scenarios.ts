import type { ScenarioSeed } from "../types";

const scenarios: ScenarioSeed[] = [
  {
    "id": "tier1_plan_a_picnic",
    "title": "Plan a Picnic",
    "tier": 1,
    "domain": "combo",
    "icon": "🧺",
    "learning_objectives": [
      "Pick foods that give you energy",
      "Share with friends",
      "Spend coins wisely",
      "Decide what to do in order"
    ],
    "initial_state": {
      "wallet": 5,
      "currency": "coins",
      "friends": 2,
      "food_items": 0,
      "location": "park"
    },
    "events": [
      {
        "description": "You're planning a picnic in the park with 2 friends! You have 5 coins. First, let's pick some food. What do you want to bring?",
        "event_type": "choice",
        "choices": [
          {
            "id": "fruit_basket",
            "label": "A basket of fruit",
            "icon": "🍎",
            "cost": 2,
            "effect": "A basket of fruit for everyone! So colorful and full of energy!"
          },
          {
            "id": "sandwiches",
            "label": "Sandwiches for everyone",
            "icon": "🥪",
            "cost": 3,
            "effect": "Yummy sandwiches! Everyone gets one!"
          }
        ]
      },
      {
        "description": "Your friends are here! One friend wants to play tag and the other wants to eat first. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "eat_first",
            "label": "Eat first, then play!",
            "icon": "🍽️",
            "cost": null,
            "effect": "Great plan! Now everyone has energy to play after eating!"
          },
          {
            "id": "play_first",
            "label": "Play first, then eat!",
            "icon": "🏃",
            "cost": null,
            "effect": "So much fun running around! Now everyone is hungry for the picnic!"
          }
        ]
      },
      {
        "description": "There's a drink stand nearby! Juice costs 2 coins. Do you have enough coins left?",
        "event_type": "choice",
        "choices": [
          {
            "id": "buy_juice",
            "label": "Buy juice to share",
            "icon": "🧃",
            "cost": 2,
            "effect": "Juice for the group! What a kind thing to share!"
          },
          {
            "id": "drink_water",
            "label": "Drink water from the fountain",
            "icon": "💧",
            "cost": 0,
            "effect": "Water is refreshing and free! Smart choice!"
          }
        ]
      }
    ],
    "recap_template": "You planned an amazing picnic! You picked food, decided when to eat and play, shared with friends, and used your coins wisely. What a great day!",
    "positive_framing_rules": [
      "Never say the student spent too much or made a mistake",
      "Celebrate sharing and planning equally",
      "Frame all food choices as giving energy"
    ],
    "ai_variation_allowed": [
      "Change the park setting details",
      "Add a surprise like a butterfly or a rainbow",
      "Vary the friend reactions to choices"
    ],
    "max_turns": 10
  },
  {
    "id": "tier1_snack_plate",
    "title": "Build a Snack Plate",
    "tier": 1,
    "domain": "health",
    "icon": "🍽️",
    "learning_objectives": [
      "Recognize different food groups",
      "Practice picking foods that give energy",
      "Build a colorful snack plate"
    ],
    "initial_state": {
      "plate_items": 0,
      "plate_max": 3,
      "location": "kitchen"
    },
    "events": [
      {
        "description": "Let's build a yummy snack plate! Pick something colorful to start!",
        "event_type": "choice",
        "choices": [
          {
            "id": "apple_slices",
            "label": "Apple slices",
            "icon": "🍎",
            "cost": null,
            "effect": "Crunchy apple slices! Red goes on the plate!"
          },
          {
            "id": "carrot_sticks",
            "label": "Carrot sticks",
            "icon": "🥕",
            "cost": null,
            "effect": "Orange carrot sticks! So crunchy and bright!"
          }
        ]
      },
      {
        "description": "Great pick! Now let's add something that gives you lots of energy!",
        "event_type": "choice",
        "choices": [
          {
            "id": "cheese_cubes",
            "label": "Cheese cubes",
            "icon": "🧀",
            "cost": null,
            "effect": "Yummy cheese! It helps you grow strong!"
          },
          {
            "id": "peanut_butter",
            "label": "Peanut butter dip",
            "icon": "🥜",
            "cost": null,
            "effect": "Peanut butter is so good for dipping!"
          }
        ]
      },
      {
        "description": "Your plate looks amazing! One more thing to make it perfect!",
        "event_type": "choice",
        "choices": [
          {
            "id": "grapes",
            "label": "Grapes",
            "icon": "🍇",
            "cost": null,
            "effect": "Sweet purple grapes! Your plate is so colorful!"
          },
          {
            "id": "crackers",
            "label": "Crackers",
            "icon": "🍘",
            "cost": null,
            "effect": "Crunchy crackers! A great addition to your plate!"
          }
        ]
      }
    ],
    "recap_template": "You built a wonderful snack plate with foods that give you energy! Your plate was so colorful and delicious.",
    "positive_framing_rules": [
      "Never label foods as healthy or unhealthy",
      "Use 'foods that give you energy' instead of 'healthy foods'",
      "Celebrate all food choices positively"
    ],
    "ai_variation_allowed": [
      "Describe the colors and textures of the food",
      "Add fun facts about the foods",
      "Have a stuffed animal friend comment on the plate"
    ],
    "max_turns": 8
  },
  {
    "id": "tier1_fruit_or_cookie",
    "title": "Fruit or Cookie?",
    "tier": 1,
    "domain": "health",
    "icon": "🍓",
    "learning_objectives": [
      "Think about what gives your body energy",
      "Practice making snack choices",
      "Learn that all foods can be part of snack time"
    ],
    "initial_state": {
      "snacks_chosen": 0,
      "location": "school"
    },
    "events": [
      {
        "description": "It's snack time at school! Your teacher put two choices on the table. Which one do you pick?",
        "event_type": "choice",
        "choices": [
          {
            "id": "strawberries",
            "label": "Strawberries",
            "icon": "🍓",
            "cost": null,
            "effect": "Sweet strawberries! They give you energy to play at recess!"
          },
          {
            "id": "cookie",
            "label": "A cookie",
            "icon": "🍪",
            "cost": null,
            "effect": "A yummy cookie! What a nice treat!"
          }
        ]
      },
      {
        "description": "After recess, you're thirsty! What would you like to drink?",
        "event_type": "choice",
        "choices": [
          {
            "id": "water",
            "label": "Water",
            "icon": "💧",
            "cost": null,
            "effect": "Refreshing water! Your body loves water!"
          },
          {
            "id": "juice",
            "label": "Apple juice",
            "icon": "🧃",
            "cost": null,
            "effect": "Sweet apple juice! Tastes like apples!"
          }
        ]
      },
      {
        "description": "It's almost time to go home. Your friend shares their snack with you! Which one do you try?",
        "event_type": "choice",
        "choices": [
          {
            "id": "banana",
            "label": "Banana",
            "icon": "🍌",
            "cost": null,
            "effect": "Bananas are so sweet and soft! What a nice friend!"
          },
          {
            "id": "crackers",
            "label": "Goldfish crackers",
            "icon": "🐟",
            "cost": null,
            "effect": "Crunchy crackers! It's fun to share snacks!"
          }
        ]
      }
    ],
    "recap_template": "You made great snack choices today! You tried different foods and thought about what gives your body energy.",
    "positive_framing_rules": [
      "Never say a snack choice was bad or wrong",
      "Frame all foods positively — treats and fruits alike",
      "Use 'gives you energy' not 'healthy vs unhealthy'"
    ],
    "ai_variation_allowed": [
      "Change the specific fruit or snack options",
      "Add a fun character who serves the snacks",
      "Describe how the food tastes and feels"
    ],
    "max_turns": 8
  },
  {
    "id": "tier1_lunch_box",
    "title": "Lunch Box Packer",
    "tier": 1,
    "domain": "health",
    "icon": "🥪",
    "learning_objectives": [
      "Choose foods from different groups",
      "Practice picking items within a limit",
      "Build a lunch that gives energy all day"
    ],
    "initial_state": {
      "lunch_items": 0,
      "lunch_max": 3,
      "location": "kitchen"
    },
    "events": [
      {
        "description": "Time to pack your lunch box! You can pick 3 things. What goes in first?",
        "event_type": "choice",
        "choices": [
          {
            "id": "sandwich",
            "label": "A sandwich",
            "icon": "🥪",
            "cost": null,
            "effect": "A yummy sandwich! That will keep you full!"
          },
          {
            "id": "pasta",
            "label": "Pasta in a container",
            "icon": "🍝",
            "cost": null,
            "effect": "Pasta is so fun to eat! Great pick!"
          }
        ]
      },
      {
        "description": "What else should go in your lunch box?",
        "event_type": "choice",
        "choices": [
          {
            "id": "orange",
            "label": "An orange",
            "icon": "🍊",
            "cost": null,
            "effect": "A juicy orange! So bright and sweet!"
          },
          {
            "id": "yogurt",
            "label": "Yogurt",
            "icon": "🥛",
            "cost": null,
            "effect": "Creamy yogurt! Yum yum!"
          }
        ]
      },
      {
        "description": "One more thing to finish your lunch box!",
        "event_type": "choice",
        "choices": [
          {
            "id": "celery",
            "label": "Celery sticks",
            "icon": "🥬",
            "cost": null,
            "effect": "Crunchy celery! So fun to munch on!"
          },
          {
            "id": "cheese_stick",
            "label": "A cheese stick",
            "icon": "🧀",
            "cost": null,
            "effect": "A cheese stick! Easy to eat and gives you energy!"
          }
        ]
      }
    ],
    "recap_template": "You packed a wonderful lunch box all by yourself! You picked different foods that will give you energy for the whole day.",
    "positive_framing_rules": [
      "Never judge any food choice negatively",
      "Celebrate the variety of foods chosen",
      "Use 'gives you energy' language throughout"
    ],
    "ai_variation_allowed": [
      "Change the specific food options offered",
      "Add descriptions of fun lunch box designs",
      "Have the student imagine opening their lunch at school"
    ],
    "max_turns": 8
  },
  {
    "id": "tier1_toy_shop",
    "title": "Toy Shop Choices",
    "tier": 1,
    "domain": "money",
    "icon": "🧸",
    "learning_objectives": [
      "Recognize coins and their values",
      "Compare prices of items",
      "Make a choice when you can't buy everything"
    ],
    "initial_state": {
      "wallet": 5,
      "currency": "dollars",
      "location": "toy shop"
    },
    "events": [
      {
        "description": "You walk into the toy shop with $5. You see three toys on the shelf.",
        "event_type": "choice",
        "choices": [
          {
            "id": "teddy",
            "label": "Teddy Bear",
            "icon": "🧸",
            "cost": 3,
            "effect": "You buy the teddy bear and have $2 left."
          },
          {
            "id": "car",
            "label": "Toy Car",
            "icon": "🚗",
            "cost": 2,
            "effect": "You buy the toy car and have $3 left."
          },
          {
            "id": "puzzle",
            "label": "Puzzle",
            "icon": "🧩",
            "cost": 4,
            "effect": "You buy the puzzle and have $1 left."
          }
        ]
      },
      {
        "description": "Your friend asks if you want to share a snack that costs $2. Do you have enough money left?",
        "event_type": "choice",
        "choices": [
          {
            "id": "share_yes",
            "label": "Yes, share the snack!",
            "icon": "🍪",
            "cost": 2,
            "effect": "You share a snack with your friend. What a kind choice!"
          },
          {
            "id": "share_no",
            "label": "No thanks, I'll save my money",
            "icon": "🐷",
            "cost": 0,
            "effect": "You decide to save your money for later. Smart thinking!"
          }
        ]
      }
    ],
    "recap_template": "Today you visited the toy shop and learned about making choices with money. You started with $5 and practiced comparing prices.",
    "positive_framing_rules": [
      "Never say a choice was wrong or bad",
      "Praise the student for thinking about their decision",
      "Frame saving and spending as both valid choices"
    ],
    "ai_variation_allowed": [
      "Add extra dialogue from the shopkeeper",
      "Describe the toys in more detail",
      "Add a surprise bonus event if the student saved money"
    ],
    "max_turns": 10
  },
  {
    "id": "tier1_lemonade_stand",
    "title": "Lemonade Stand",
    "tier": 1,
    "domain": "money",
    "icon": "🍋",
    "learning_objectives": [
      "Understand earning money by selling something",
      "Count coins and small bills",
      "Make simple spending decisions"
    ],
    "initial_state": {
      "wallet": 0,
      "currency": "dollars",
      "location": "front yard",
      "inventory": {
        "lemons": 10,
        "cups": 10,
        "sugar": 1
      }
    },
    "events": [
      {
        "description": "You set up a lemonade stand in your front yard! Each cup of lemonade sells for $1. A neighbor walks up and wants to buy some.",
        "event_type": "choice",
        "choices": [
          {
            "id": "sell_one",
            "label": "Sell 1 cup",
            "icon": "🥤",
            "cost": null,
            "effect": "You sell one cup and earn $1!"
          },
          {
            "id": "sell_two",
            "label": "Sell 2 cups",
            "icon": "🥤🥤",
            "cost": null,
            "effect": "You sell two cups and earn $2!"
          },
          {
            "id": "free_sample",
            "label": "Give a free sample",
            "icon": "🎁",
            "cost": null,
            "effect": "You give a free sample. The neighbor smiles and tells their friends!"
          }
        ]
      },
      {
        "description": "After selling lemonade all morning, you have some money. The ice cream truck is coming! An ice cream costs $3.",
        "event_type": "choice",
        "choices": [
          {
            "id": "buy_icecream",
            "label": "Buy ice cream",
            "icon": "🍦",
            "cost": 3,
            "effect": "You enjoy a cold ice cream on a hot day!"
          },
          {
            "id": "save_money",
            "label": "Save your money",
            "icon": "🐷",
            "cost": 0,
            "effect": "You put your money in your piggy bank. Great saving!"
          },
          {
            "id": "buy_more_lemons",
            "label": "Buy more lemons to sell",
            "icon": "🍋",
            "cost": 2,
            "effect": "You buy more lemons to make more lemonade tomorrow!"
          }
        ]
      }
    ],
    "recap_template": "Today you ran a lemonade stand and learned about earning and spending money. Great job being a young entrepreneur!",
    "positive_framing_rules": [
      "Never say a choice was wrong or bad",
      "Celebrate both earning and spending decisions",
      "Encourage entrepreneurial thinking"
    ],
    "ai_variation_allowed": [
      "Add extra customers with different requests",
      "Vary the weather to affect sales",
      "Add a surprise event like a dog visiting the stand"
    ],
    "max_turns": 12
  },
  {
    "id": "tier1_sharing_fair",
    "title": "Sharing Fair",
    "tier": 1,
    "domain": "social",
    "icon": "🤝",
    "learning_objectives": [
      "Practice sharing with a friend",
      "Think about fairness",
      "Learn that sharing can be fun"
    ],
    "initial_state": {
      "toys": 6,
      "friends": 1,
      "location": "playroom"
    },
    "events": [
      {
        "description": "Your friend came over to play! You have 6 toys. How do you want to share?",
        "event_type": "choice",
        "choices": [
          {
            "id": "share_equal",
            "label": "3 toys each — split evenly!",
            "icon": "⚖️",
            "cost": null,
            "effect": "You each get 3 toys! That feels really fair!"
          },
          {
            "id": "share_favorite",
            "label": "Give your friend their favorite toy",
            "icon": "🎁",
            "cost": null,
            "effect": "Your friend is so happy you picked their favorite! What a kind thing to do!"
          }
        ]
      },
      {
        "description": "You're both playing and your friend wants to try the toy you're using. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "take_turns",
            "label": "Take turns!",
            "icon": "🔄",
            "cost": null,
            "effect": "Taking turns means everyone gets a chance! Great idea!"
          },
          {
            "id": "trade",
            "label": "Trade for a different toy",
            "icon": "🔀",
            "cost": null,
            "effect": "You swapped toys and both found something fun! Nice trading!"
          }
        ]
      },
      {
        "description": "It's almost time for your friend to go home. There's one toy left to play with together!",
        "event_type": "choice",
        "choices": [
          {
            "id": "play_together",
            "label": "Play with it together",
            "icon": "👫",
            "cost": null,
            "effect": "You played together and had twice the fun!"
          },
          {
            "id": "let_friend",
            "label": "Let your friend have the last turn",
            "icon": "💝",
            "cost": null,
            "effect": "Your friend loved the last turn! You're such a kind friend!"
          }
        ]
      }
    ],
    "recap_template": "You practiced sharing with a friend today! You learned that sharing and taking turns makes playtime more fun for everyone.",
    "positive_framing_rules": [
      "Never say a sharing choice was selfish or wrong",
      "Celebrate both equal sharing and generous choices",
      "Frame all outcomes as positive for the friendship"
    ],
    "ai_variation_allowed": [
      "Change the types of toys being shared",
      "Add reactions from the friend",
      "Describe the fun games they play together"
    ],
    "max_turns": 8
  },
  {
    "id": "tier1_how_does_that_feel",
    "title": "How Does That Feel?",
    "tier": 1,
    "domain": "social",
    "icon": "😊",
    "learning_objectives": [
      "Recognize different emotions",
      "Connect situations to feelings",
      "Practice naming how you feel"
    ],
    "initial_state": {
      "emotions_identified": 0,
      "location": "school"
    },
    "events": [
      {
        "description": "Your friend draws you a picture and gives it to you. How does that make you feel?",
        "event_type": "choice",
        "choices": [
          {
            "id": "happy",
            "label": "Happy!",
            "icon": "😊",
            "cost": null,
            "effect": "That's right! Getting a gift from a friend can make us feel happy and warm inside!"
          },
          {
            "id": "surprised",
            "label": "Surprised!",
            "icon": "😲",
            "cost": null,
            "effect": "Yes! Surprises can feel exciting and fun!"
          }
        ]
      },
      {
        "description": "Oh no, you drop your ice cream on the ground. How might you feel?",
        "event_type": "choice",
        "choices": [
          {
            "id": "sad",
            "label": "Sad",
            "icon": "😢",
            "cost": null,
            "effect": "It's okay to feel sad when something doesn't go the way we hoped. Feelings pass!"
          },
          {
            "id": "frustrated",
            "label": "Frustrated",
            "icon": "😤",
            "cost": null,
            "effect": "It's okay to feel frustrated! That happens to everyone sometimes."
          }
        ]
      },
      {
        "description": "Your teacher says you did a great job on your drawing! How does that feel?",
        "event_type": "choice",
        "choices": [
          {
            "id": "proud",
            "label": "Proud!",
            "icon": "🌟",
            "cost": null,
            "effect": "Feeling proud means you know you tried your best! That's wonderful!"
          },
          {
            "id": "excited",
            "label": "Excited!",
            "icon": "🎉",
            "cost": null,
            "effect": "Getting praise can make us feel excited and eager to do more!"
          }
        ]
      }
    ],
    "recap_template": "You did a great job naming feelings today! Knowing how we feel helps us understand ourselves and be kind to others.",
    "positive_framing_rules": [
      "Never say an emotion is wrong or bad",
      "Validate all feelings as normal and okay",
      "Use simple, warm language to describe emotions"
    ],
    "ai_variation_allowed": [
      "Change the specific scenarios that trigger emotions",
      "Add more emotion vocabulary naturally",
      "Describe how the body might feel with each emotion"
    ],
    "max_turns": 8
  },
  {
    "id": "tier1_making_friends",
    "title": "Making Friends",
    "tier": 1,
    "domain": "social",
    "icon": "💛",
    "learning_objectives": [
      "Practice kind responses",
      "Learn what makes a good friend",
      "Think about how words make others feel"
    ],
    "initial_state": {
      "friends_made": 0,
      "location": "playground"
    },
    "events": [
      {
        "description": "A new kid is sitting alone at the playground. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "say_hi",
            "label": "Say hi and ask to play",
            "icon": "👋",
            "cost": null,
            "effect": "You said hi! The new kid smiles and wants to play! Great job reaching out!"
          },
          {
            "id": "share_toy",
            "label": "Share your toy with them",
            "icon": "🎾",
            "cost": null,
            "effect": "You shared your toy! The new kid's face lights up! So kind!"
          }
        ]
      },
      {
        "description": "Your new friend trips and falls down. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "help_up",
            "label": "Help them up",
            "icon": "🤝",
            "cost": null,
            "effect": "You helped them up and asked if they were okay. That's what friends do!"
          },
          {
            "id": "get_teacher",
            "label": "Get a teacher to help",
            "icon": "👩‍🏫",
            "cost": null,
            "effect": "You got a grown-up to help! That was smart and caring!"
          }
        ]
      },
      {
        "description": "Your new friend wants to play a different game than you. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "try_their_game",
            "label": "Try their game first",
            "icon": "🎮",
            "cost": null,
            "effect": "You tried something new and it was really fun! Being open to new things is great!"
          },
          {
            "id": "take_turns",
            "label": "Play both games, take turns",
            "icon": "🔄",
            "cost": null,
            "effect": "Great idea! You each got to play your favorite game! Everyone wins!"
          }
        ]
      }
    ],
    "recap_template": "You practiced being a kind friend today! You learned that saying hi, helping others, and being flexible makes friendships grow.",
    "positive_framing_rules": [
      "Never present unkind options as choices",
      "Celebrate every kind action the student takes",
      "Frame all social situations as opportunities to connect"
    ],
    "ai_variation_allowed": [
      "Change the playground activities",
      "Add dialogue from the new friend",
      "Describe the games they play together"
    ],
    "max_turns": 8
  },
  {
    "id": "tier1_morning_routine",
    "title": "Morning Routine Builder",
    "tier": 1,
    "domain": "time",
    "icon": "🌅",
    "learning_objectives": [
      "Learn the order of morning tasks",
      "Practice sequencing activities",
      "Build a routine that works"
    ],
    "initial_state": {
      "tasks_completed": 0,
      "total_tasks": 3,
      "location": "bedroom"
    },
    "events": [
      {
        "description": "Good morning! It's time to get ready for school. What do you want to do first?",
        "event_type": "choice",
        "choices": [
          {
            "id": "brush_teeth",
            "label": "Brush your teeth",
            "icon": "🪥",
            "cost": null,
            "effect": "Sparkly clean teeth! Great start to the day!"
          },
          {
            "id": "get_dressed",
            "label": "Get dressed",
            "icon": "👕",
            "cost": null,
            "effect": "You picked out a great outfit! Looking good!"
          }
        ]
      },
      {
        "description": "One thing done! What's next on your morning routine?",
        "event_type": "choice",
        "choices": [
          {
            "id": "eat_breakfast",
            "label": "Eat breakfast",
            "icon": "🥣",
            "cost": null,
            "effect": "Yummy cereal! Now you have energy for the day!"
          },
          {
            "id": "pack_bag",
            "label": "Pack your backpack",
            "icon": "🎒",
            "cost": null,
            "effect": "Your backpack is all ready to go!"
          }
        ]
      },
      {
        "description": "Almost ready! One more thing before the bus comes!",
        "event_type": "choice",
        "choices": [
          {
            "id": "put_shoes",
            "label": "Put on your shoes",
            "icon": "👟",
            "cost": null,
            "effect": "Shoes on and tied! You're ready to go!"
          },
          {
            "id": "hug_goodbye",
            "label": "Give a goodbye hug",
            "icon": "🤗",
            "cost": null,
            "effect": "What a sweet goodbye! Have a great day!"
          }
        ]
      }
    ],
    "recap_template": "Today you built your very own morning routine! You practiced putting tasks in order to get ready for school.",
    "positive_framing_rules": [
      "Never say the student picked the wrong order",
      "Celebrate each completed task as progress",
      "Frame all routines as equally good choices"
    ],
    "ai_variation_allowed": [
      "Add fun descriptions of breakfast options",
      "Describe the weather outside",
      "Add a pet greeting the student in the morning"
    ],
    "max_turns": 8
  },
  {
    "id": "tier1_getting_ready_race",
    "title": "Getting Ready Race",
    "tier": 1,
    "domain": "time",
    "icon": "⏰",
    "learning_objectives": [
      "Learn to pick what to do first",
      "Practice making quick decisions",
      "Understand that some tasks come before others"
    ],
    "initial_state": {
      "tasks_completed": 0,
      "total_tasks": 3,
      "location": "home"
    },
    "events": [
      {
        "description": "Oh! You just woke up and the school bus is coming soon! Let's figure out a plan. What should you do first?",
        "event_type": "choice",
        "choices": [
          {
            "id": "get_dressed_first",
            "label": "Get dressed quickly",
            "icon": "👕",
            "cost": null,
            "effect": "Smart thinking! You got dressed right away!"
          },
          {
            "id": "eat_first",
            "label": "Eat a quick breakfast",
            "icon": "🍎",
            "cost": null,
            "effect": "An apple gives you energy! Good choice!"
          }
        ]
      },
      {
        "description": "Great job! Now what's the next important thing?",
        "event_type": "choice",
        "choices": [
          {
            "id": "grab_bag",
            "label": "Grab your backpack",
            "icon": "🎒",
            "cost": null,
            "effect": "You remembered your backpack! All your homework is inside!"
          },
          {
            "id": "brush_teeth",
            "label": "Brush your teeth",
            "icon": "🪥",
            "cost": null,
            "effect": "Fresh and clean! Your smile is sparkling!"
          }
        ]
      },
      {
        "description": "The bus is almost here! One last thing!",
        "event_type": "choice",
        "choices": [
          {
            "id": "wave_bye",
            "label": "Wave goodbye",
            "icon": "👋",
            "cost": null,
            "effect": "You waved goodbye and ran to the bus! Made it!"
          },
          {
            "id": "check_bag",
            "label": "Double-check your bag",
            "icon": "✅",
            "cost": null,
            "effect": "Everything is there! You're so organized!"
          }
        ]
      }
    ],
    "recap_template": "You figured out a great plan to get ready! You practiced picking what to do first when there's a lot to do.",
    "positive_framing_rules": [
      "Never say the student is running out of time",
      "Celebrate each step as a win",
      "Frame the situation as an exciting adventure, not stressful"
    ],
    "ai_variation_allowed": [
      "Add a silly pet following the student around",
      "Vary the weather outside",
      "Add encouraging narration between steps"
    ],
    "max_turns": 8
  },
  {
    "id": "tier1_bedtime_countdown",
    "title": "Bedtime Countdown",
    "tier": 1,
    "domain": "time",
    "icon": "🌙",
    "learning_objectives": [
      "Learn to sequence bedtime activities",
      "Practice winding down before sleep",
      "Understand that routines help us feel ready"
    ],
    "initial_state": {
      "tasks_completed": 0,
      "total_tasks": 3,
      "location": "home"
    },
    "events": [
      {
        "description": "It's almost bedtime! You have time for 3 activities before you go to sleep. What do you want to do first?",
        "event_type": "choice",
        "choices": [
          {
            "id": "bath",
            "label": "Take a warm bath",
            "icon": "🛁",
            "cost": null,
            "effect": "Splish splash! You feel warm and cozy!"
          },
          {
            "id": "story",
            "label": "Read a story",
            "icon": "📖",
            "cost": null,
            "effect": "What a fun story! Your imagination is amazing!"
          }
        ]
      },
      {
        "description": "That was nice! What do you want to do next?",
        "event_type": "choice",
        "choices": [
          {
            "id": "brush_teeth",
            "label": "Brush your teeth",
            "icon": "🪥",
            "cost": null,
            "effect": "Sparkly teeth! The tooth fairy would be proud!"
          },
          {
            "id": "pajamas",
            "label": "Put on pajamas",
            "icon": "🌟",
            "cost": null,
            "effect": "Your cozy pajamas feel so soft and warm!"
          }
        ]
      },
      {
        "description": "One more thing before lights out!",
        "event_type": "choice",
        "choices": [
          {
            "id": "goodnight_hug",
            "label": "Goodnight hugs",
            "icon": "🤗",
            "cost": null,
            "effect": "The best hugs! Sweet dreams!"
          },
          {
            "id": "stuffed_animal",
            "label": "Pick a stuffed friend",
            "icon": "🧸",
            "cost": null,
            "effect": "Your stuffed friend is ready to sleep with you!"
          }
        ]
      }
    ],
    "recap_template": "You built a wonderful bedtime routine! Getting ready for bed in a good order helps you feel calm and cozy.",
    "positive_framing_rules": [
      "Never mention staying up too late or being in trouble",
      "Frame bedtime as a cozy, positive experience",
      "Celebrate each step of the routine"
    ],
    "ai_variation_allowed": [
      "Add descriptions of a favorite stuffed animal",
      "Vary the bedtime story topic",
      "Add a lullaby or calming description"
    ],
    "max_turns": 8
  },
  {
    "id": "tier2_birthday_party",
    "title": "Plan a Birthday Party",
    "tier": 2,
    "domain": "combo",
    "icon": "🎂",
    "learning_objectives": [
      "Budget for party supplies within a limit",
      "Schedule party activities in order",
      "Pick food that includes energy-giving options",
      "Handle friend preferences and invitations"
    ],
    "initial_state": {
      "wallet": 50,
      "currency": "dollars",
      "guests": 6,
      "hours": 3,
      "location": "home"
    },
    "events": [
      {
        "description": "You're planning your birthday party! You have $50 and 6 friends coming. First, let's pick decorations. Balloons are $5, streamers are $3, and a banner is $8.",
        "event_type": "choice",
        "choices": [
          {
            "id": "all_decor",
            "label": "All three! ($16)",
            "icon": "🎈🎊",
            "cost": 16,
            "effect": "The room looks amazing! Balloons, streamers, and a banner! $34 left."
          },
          {
            "id": "balloons_streamers",
            "label": "Balloons + streamers ($8)",
            "icon": "🎈",
            "cost": 8,
            "effect": "Colorful and festive! $42 left for food and activities!"
          },
          {
            "id": "diy_decor",
            "label": "Make your own decorations ($3 for supplies)",
            "icon": "✂️",
            "cost": 3,
            "effect": "Handmade decorations are the coolest! $47 left and so creative!"
          }
        ]
      },
      {
        "description": "Time for food planning! Pizza costs $15, fruit and veggie trays cost $10, and a cake costs $12. What's on the menu?",
        "event_type": "choice",
        "choices": [
          {
            "id": "pizza_cake",
            "label": "Pizza + cake ($27)",
            "icon": "🍕🎂",
            "cost": 27,
            "effect": "Pizza and cake — party classics! Everyone will be happy!"
          },
          {
            "id": "full_spread",
            "label": "Pizza + fruit tray + cake ($37)",
            "icon": "🍕🍎🎂",
            "cost": 37,
            "effect": "A full spread! Pizza, fresh fruit, and cake! Lots of energy-giving options!"
          },
          {
            "id": "budget_food",
            "label": "Pizza + homemade cupcakes ($18)",
            "icon": "🍕🧁",
            "cost": 18,
            "effect": "Pizza and homemade cupcakes! Personal touch AND budget-friendly!"
          }
        ]
      },
      {
        "description": "Now let's plan the party schedule! The party is 3 hours. You have games, eating, and cake time. Two friends want to play different games. What's the plan?",
        "event_type": "choice",
        "choices": [
          {
            "id": "structured",
            "label": "Games (1hr) → Eat (1hr) → Cake + free play (1hr)",
            "icon": "📋",
            "cost": null,
            "effect": "A clear plan! Everyone knows what's happening and when!"
          },
          {
            "id": "flexible",
            "label": "Let everyone vote on what to do next",
            "icon": "🗳️",
            "cost": null,
            "effect": "Democratic party planning! Everyone feels included in the decisions!"
          },
          {
            "id": "two_games",
            "label": "Play both games, then eat and cake",
            "icon": "🎮⚽",
            "cost": null,
            "effect": "Both friends' games get played! Great compromise!"
          }
        ]
      },
      {
        "description": "Party is almost over! One friend seems a little left out because they didn't win any games. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "include_them",
            "label": "Ask them to help with a special job",
            "icon": "⭐",
            "cost": null,
            "effect": "You asked them to help serve cake! They feel important and included!"
          },
          {
            "id": "team_game",
            "label": "Start a team game where everyone wins",
            "icon": "🤝",
            "cost": null,
            "effect": "A cooperative game means everyone's on the same team! Everyone's laughing!"
          },
          {
            "id": "chat",
            "label": "Sit and chat with them",
            "icon": "💬",
            "cost": null,
            "effect": "Sometimes a friend just needs someone to talk to. You're a great friend!"
          }
        ]
      }
    ],
    "recap_template": "You planned an amazing birthday party! You budgeted for supplies and food, scheduled activities, picked energy-giving snacks, and made sure all your friends felt included.",
    "positive_framing_rules": [
      "Never say the student overspent or the party was lacking",
      "Celebrate both budget-friendly and splurge choices",
      "Frame social awareness as a strength"
    ],
    "ai_variation_allowed": [
      "Change the party theme",
      "Vary the guest personalities",
      "Add a surprise moment like a fun delivery"
    ],
    "max_turns": 14
  },
  {
    "id": "tier2_pack_lunch",
    "title": "Pack a Lunch Box",
    "tier": 2,
    "domain": "health",
    "icon": "🥗",
    "learning_objectives": [
      "Build a balanced meal from options",
      "Identify different food groups",
      "Practice choosing a variety of foods"
    ],
    "initial_state": {
      "lunch_items": [],
      "food_groups_covered": [],
      "location": "kitchen"
    },
    "events": [
      {
        "description": "Time to pack your lunch! A great lunch has something from each food group: grains, protein, fruit, veggies, and dairy. Let's start with your main item!",
        "event_type": "choice",
        "choices": [
          {
            "id": "turkey_wrap",
            "label": "Turkey wrap (grain + protein)",
            "icon": "🌯",
            "cost": null,
            "effect": "A turkey wrap covers grains AND protein! Two food groups in one! Smart pick!"
          },
          {
            "id": "pb_sandwich",
            "label": "PB&J sandwich (grain + protein)",
            "icon": "🥪",
            "cost": null,
            "effect": "PB&J is a classic! Bread for grains and peanut butter for protein!"
          },
          {
            "id": "pasta_salad",
            "label": "Pasta salad with cheese (grain + dairy)",
            "icon": "🍝",
            "cost": null,
            "effect": "Pasta salad with cheese! Grains and dairy covered!"
          }
        ]
      },
      {
        "description": "Great main dish! Now let's add a fruit or veggie. What sounds good?",
        "event_type": "choice",
        "choices": [
          {
            "id": "apple",
            "label": "Apple slices",
            "icon": "🍎",
            "cost": null,
            "effect": "Crisp apple slices! Fruit group covered!"
          },
          {
            "id": "baby_carrots",
            "label": "Baby carrots",
            "icon": "🥕",
            "cost": null,
            "effect": "Crunchy carrots! Veggie group covered!"
          },
          {
            "id": "grapes_peppers",
            "label": "Grapes and bell pepper strips",
            "icon": "🍇",
            "cost": null,
            "effect": "Fruit AND veggies! You're covering lots of food groups!"
          }
        ]
      },
      {
        "description": "Looking good! Let's add one more thing and a drink to finish your lunch.",
        "event_type": "choice",
        "choices": [
          {
            "id": "yogurt_water",
            "label": "Yogurt + water bottle",
            "icon": "🥛",
            "cost": null,
            "effect": "Yogurt for dairy and water to stay hydrated! Complete lunch!"
          },
          {
            "id": "cheese_juice",
            "label": "String cheese + juice box",
            "icon": "🧀",
            "cost": null,
            "effect": "String cheese for dairy and juice for a sweet drink! All packed!"
          },
          {
            "id": "granola_milk",
            "label": "Granola bar + milk",
            "icon": "🥜",
            "cost": null,
            "effect": "Extra energy from granola and calcium from milk! Well-rounded!"
          }
        ]
      }
    ],
    "recap_template": "You packed an awesome lunch! You included items from different food groups to give you energy all afternoon. Great meal planning!",
    "positive_framing_rules": [
      "Never label any food as unhealthy or bad",
      "Use 'gives you energy' and 'helps you grow' language",
      "Celebrate variety and balance, not restriction"
    ],
    "ai_variation_allowed": [
      "Change the specific food options",
      "Add fun descriptions of how foods taste",
      "Mention how different foods help your body"
    ],
    "max_turns": 10
  },
  {
    "id": "tier2_balanced_plate",
    "title": "Balanced Plate Builder",
    "tier": 2,
    "domain": "health",
    "icon": "🍽️",
    "learning_objectives": [
      "Learn about MyPlate food categories",
      "Build meals that cover all food groups",
      "Practice assembling balanced meals"
    ],
    "initial_state": {
      "plate_sections": {
        "grains": false,
        "protein": false,
        "vegetables": false,
        "fruits": false,
        "dairy": false
      },
      "location": "cafeteria"
    },
    "events": [
      {
        "description": "Welcome to the school cafeteria! Your plate has 5 sections to fill: grains, protein, vegetables, fruits, and dairy. Let's start with protein — what sounds good?",
        "event_type": "choice",
        "choices": [
          {
            "id": "chicken",
            "label": "Grilled chicken",
            "icon": "🍗",
            "cost": null,
            "effect": "Grilled chicken is packed with protein! It helps your muscles grow strong!"
          },
          {
            "id": "beans",
            "label": "Black beans",
            "icon": "🫘",
            "cost": null,
            "effect": "Beans are a great protein source! They also have fiber for energy!"
          },
          {
            "id": "fish",
            "label": "Fish sticks",
            "icon": "🐟",
            "cost": null,
            "effect": "Fish is great for your brain! Protein section filled!"
          }
        ]
      },
      {
        "description": "Protein is on the plate! Now let's fill the grains and veggies sections.",
        "event_type": "choice",
        "choices": [
          {
            "id": "rice_broccoli",
            "label": "Brown rice + broccoli",
            "icon": "🍚🥦",
            "cost": null,
            "effect": "Rice for grains and broccoli for veggies! Two sections filled at once!"
          },
          {
            "id": "bread_corn",
            "label": "Whole wheat roll + corn",
            "icon": "🍞🌽",
            "cost": null,
            "effect": "A roll for grains and sweet corn for veggies! Great combo!"
          },
          {
            "id": "pasta_salad",
            "label": "Pasta + side salad",
            "icon": "🍝🥗",
            "cost": null,
            "effect": "Pasta for grains and salad for veggies! Your plate is filling up!"
          }
        ]
      },
      {
        "description": "Almost there! You need fruit and dairy to complete your plate. What do you pick?",
        "event_type": "choice",
        "choices": [
          {
            "id": "orange_milk",
            "label": "Orange + milk",
            "icon": "🍊🥛",
            "cost": null,
            "effect": "Vitamin C from the orange and calcium from milk! Plate complete!"
          },
          {
            "id": "berries_yogurt",
            "label": "Berries + yogurt",
            "icon": "🫐🥛",
            "cost": null,
            "effect": "Antioxidants from berries and protein from yogurt! What a plate!"
          },
          {
            "id": "banana_cheese",
            "label": "Banana + cheese slice",
            "icon": "🍌🧀",
            "cost": null,
            "effect": "Potassium from banana and calcium from cheese! All 5 sections filled!"
          }
        ]
      }
    ],
    "recap_template": "You built a balanced plate with all 5 food groups! Your body gets different nutrients from each group, and together they give you energy for the whole day.",
    "positive_framing_rules": [
      "Never shame any food choice",
      "Focus on what foods give your body, not calories",
      "Celebrate completing the plate regardless of specific choices"
    ],
    "ai_variation_allowed": [
      "Change the cafeteria setting",
      "Add fun facts about nutrients",
      "Vary the specific food options per group"
    ],
    "max_turns": 10
  },
  {
    "id": "tier2_snack_shop",
    "title": "Snack Shop",
    "tier": 2,
    "domain": "health",
    "icon": "🏪",
    "learning_objectives": [
      "Pick snacks within a budget",
      "Choose snacks that include fruits or protein",
      "Practice combining money and nutrition thinking"
    ],
    "initial_state": {
      "wallet": 5,
      "currency": "dollars",
      "snacks_bought": [],
      "location": "school snack shop"
    },
    "events": [
      {
        "description": "The school snack shop is open! You have $5. An apple is $1, trail mix is $2, a juice box is $1, and a cookie is $1. You can pick up to 3 items. What do you grab first?",
        "event_type": "choice",
        "choices": [
          {
            "id": "trail_mix",
            "label": "Trail mix ($2)",
            "icon": "🥜",
            "cost": 2,
            "effect": "Trail mix has nuts and dried fruit — energy that lasts! $3 left."
          },
          {
            "id": "apple",
            "label": "Apple ($1)",
            "icon": "🍎",
            "cost": 1,
            "effect": "A crunchy apple! Quick energy from natural sugars! $4 left."
          },
          {
            "id": "cookie",
            "label": "Cookie ($1)",
            "icon": "🍪",
            "cost": 1,
            "effect": "A tasty cookie treat! $4 left."
          }
        ]
      },
      {
        "description": "Good pick! What else do you want from the snack shop?",
        "event_type": "choice",
        "choices": [
          {
            "id": "juice",
            "label": "Juice box ($1)",
            "icon": "🧃",
            "cost": 1,
            "effect": "Apple juice to drink! Refreshing!"
          },
          {
            "id": "cheese_stick",
            "label": "Cheese stick ($2)",
            "icon": "🧀",
            "cost": 2,
            "effect": "Cheese stick for protein! Keeps you full longer!"
          },
          {
            "id": "banana",
            "label": "Banana ($1)",
            "icon": "🍌",
            "cost": 1,
            "effect": "A banana for quick energy! Great choice!"
          }
        ]
      },
      {
        "description": "Last chance! You have some money left. Do you want one more item or save the rest?",
        "event_type": "choice",
        "choices": [
          {
            "id": "one_more",
            "label": "One more snack",
            "icon": "🛒",
            "cost": 1,
            "effect": "Your snack bag is full! You picked a great variety!"
          },
          {
            "id": "save_change",
            "label": "Save the rest for tomorrow",
            "icon": "💰",
            "cost": 0,
            "effect": "Smart thinking! You'll have money for snacks tomorrow too!"
          }
        ]
      }
    ],
    "recap_template": "You shopped at the snack shop and practiced choosing snacks within a budget! You thought about both what you wanted and what gives you energy.",
    "positive_framing_rules": [
      "Never label snacks as junk food or bad choices",
      "Celebrate budget-conscious decisions",
      "Frame all foods as having something to offer"
    ],
    "ai_variation_allowed": [
      "Change the snack shop inventory",
      "Add a special deal or sale item",
      "Vary prices slightly"
    ],
    "max_turns": 10
  },
  {
    "id": "tier2_weekly_allowance",
    "title": "Weekly Allowance",
    "tier": 2,
    "domain": "money",
    "icon": "💵",
    "learning_objectives": [
      "Plan spending over multiple weeks",
      "Track a recurring budget",
      "Decide between spending now and saving for later"
    ],
    "initial_state": {
      "wallet": 10,
      "currency": "dollars",
      "week": 1,
      "total_weeks": 4,
      "savings": 0
    },
    "events": [
      {
        "description": "It's Week 1! You get $10 allowance. Your friend invites you to the movies ($8) and there's a book fair at school ($5). What do you want to do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "movies",
            "label": "Go to the movies",
            "icon": "🎬",
            "cost": 8,
            "effect": "You saw an awesome movie! You have $2 left this week."
          },
          {
            "id": "book_fair",
            "label": "Shop at the book fair",
            "icon": "📚",
            "cost": 5,
            "effect": "You got a great book! You have $5 left this week."
          },
          {
            "id": "save_all",
            "label": "Save it all",
            "icon": "🐷",
            "cost": 0,
            "effect": "You put $10 in your savings! Great patience!"
          }
        ]
      },
      {
        "description": "Week 2! Another $10 allowance. There's a cool toy you've been wanting for $20. You also need art supplies for school ($6).",
        "event_type": "choice",
        "choices": [
          {
            "id": "art_supplies",
            "label": "Buy art supplies",
            "icon": "🎨",
            "cost": 6,
            "effect": "You got everything you need for art class! Nice planning!"
          },
          {
            "id": "save_for_toy",
            "label": "Save toward the toy",
            "icon": "🧸",
            "cost": 0,
            "effect": "You're getting closer to that toy! Great saving!"
          },
          {
            "id": "split",
            "label": "Buy supplies and save the rest",
            "icon": "⚖️",
            "cost": 6,
            "effect": "Supplies bought and $4 saved! You're balancing needs and wants!"
          }
        ]
      },
      {
        "description": "Week 3! Another $10. A friend is having a birthday and you want to get them a gift ($7). There's also a bake sale ($3).",
        "event_type": "choice",
        "choices": [
          {
            "id": "gift",
            "label": "Buy a birthday gift",
            "icon": "🎁",
            "cost": 7,
            "effect": "Your friend will love this gift! You have $3 left."
          },
          {
            "id": "gift_and_bake",
            "label": "Gift ($7) and bake sale ($3)",
            "icon": "🎂",
            "cost": 10,
            "effect": "Gift AND cupcakes! You spent your whole allowance but made great memories!"
          },
          {
            "id": "homemade_gift",
            "label": "Make a homemade gift, save money",
            "icon": "✂️",
            "cost": 0,
            "effect": "A handmade gift from the heart! And you saved all $10!"
          }
        ]
      },
      {
        "description": "Week 4! Last week of the month. Let's count up your savings and see what you've accomplished!",
        "event_type": "choice",
        "choices": [
          {
            "id": "treat_yourself",
            "label": "Buy something fun with savings",
            "icon": "🎉",
            "cost": null,
            "effect": "You earned a treat! Saving up feels rewarding!"
          },
          {
            "id": "keep_saving",
            "label": "Keep saving for next month",
            "icon": "💰",
            "cost": 0,
            "effect": "Look at those savings grow! You're building great habits!"
          }
        ]
      }
    ],
    "recap_template": "You managed your allowance for a whole month! You practiced deciding between spending, saving, and giving. Every choice taught you something about budgeting.",
    "positive_framing_rules": [
      "Never say the student wasted money",
      "Celebrate both spending and saving as valid strategies",
      "Frame gift-giving as a positive use of money"
    ],
    "ai_variation_allowed": [
      "Change the specific items available to buy",
      "Add surprise deals or sales",
      "Vary friend reactions to gifts"
    ],
    "max_turns": 12
  },
  {
    "id": "tier2_bake_sale",
    "title": "Bake Sale Business",
    "tier": 2,
    "domain": "money",
    "icon": "🧁",
    "learning_objectives": [
      "Understand that making things costs money",
      "Set prices for items you sell",
      "Track money coming in and going out"
    ],
    "initial_state": {
      "wallet": 20,
      "currency": "dollars",
      "inventory": {},
      "earnings": 0
    },
    "events": [
      {
        "description": "You're running a bake sale! You have $20 to buy ingredients. Cupcake mix costs $8 (makes 12 cupcakes) and cookie dough costs $5 (makes 20 cookies). What do you buy?",
        "event_type": "choice",
        "choices": [
          {
            "id": "both",
            "label": "Cupcakes ($8) and cookies ($5)",
            "icon": "🧁🍪",
            "cost": 13,
            "effect": "Great variety! You spent $13 and have $7 left. You have 12 cupcakes and 20 cookies to sell!"
          },
          {
            "id": "cupcakes_only",
            "label": "Two batches of cupcakes ($16)",
            "icon": "🧁🧁",
            "cost": 16,
            "effect": "24 cupcakes ready to sell! You spent $16 and have $4 left."
          },
          {
            "id": "cookies_only",
            "label": "Four batches of cookies ($20)",
            "icon": "🍪🍪",
            "cost": 20,
            "effect": "80 cookies! That's a LOT of cookies to sell! You spent all $20."
          }
        ]
      },
      {
        "description": "Time to set your prices! How much will you charge?",
        "event_type": "choice",
        "choices": [
          {
            "id": "price_low",
            "label": "$1 each — sell a lot!",
            "icon": "💲",
            "cost": null,
            "effect": "Low prices attract lots of customers! Nearly everything sold!"
          },
          {
            "id": "price_medium",
            "label": "$2 each — balanced",
            "icon": "💲💲",
            "cost": null,
            "effect": "Good price! Most items sold and you earned more per item!"
          },
          {
            "id": "price_high",
            "label": "$3 each — earn more per item",
            "icon": "💲💲💲",
            "cost": null,
            "effect": "Higher prices! Fewer people bought, but you earned more from each sale!"
          }
        ]
      },
      {
        "description": "The bake sale is going great! A teacher asks if you can donate some for the school raffle. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "donate_some",
            "label": "Donate 5 items",
            "icon": "🎁",
            "cost": null,
            "effect": "That's so generous! The teacher thanks you and tells everyone about your stand!"
          },
          {
            "id": "sell_all",
            "label": "Keep selling everything",
            "icon": "💰",
            "cost": null,
            "effect": "You focus on your business and earn more money! Smart business thinking!"
          }
        ]
      }
    ],
    "recap_template": "You ran a bake sale business! You learned about buying ingredients, setting prices, and making decisions about your earnings. Great job, entrepreneur!",
    "positive_framing_rules": [
      "Never say the student priced things wrong",
      "Celebrate both generous and business-minded choices",
      "Frame all outcomes as learning experiences"
    ],
    "ai_variation_allowed": [
      "Change the baked goods available",
      "Add weather or surprise customer events",
      "Vary the number of customers"
    ],
    "max_turns": 12
  },
  {
    "id": "tier2_pet_care_budget",
    "title": "Pet Care Budget",
    "tier": 2,
    "domain": "money",
    "icon": "🐕",
    "learning_objectives": [
      "Understand ongoing costs vs one-time costs",
      "Plan a budget for taking care of a pet",
      "Make choices about wants vs needs for a pet"
    ],
    "initial_state": {
      "wallet": 50,
      "currency": "dollars",
      "pet": "puppy",
      "supplies": []
    },
    "events": [
      {
        "description": "You're adopting a puppy! You have $50 to get started. First, your puppy needs food and a bowl. Dog food is $15 and a bowl is $5. What else do you want to get?",
        "event_type": "choice",
        "choices": [
          {
            "id": "food_bowl_toy",
            "label": "Food ($15) + Bowl ($5) + Toy ($8)",
            "icon": "🦴",
            "cost": 28,
            "effect": "Food, bowl, and a squeaky toy! Your puppy is so happy! $22 left."
          },
          {
            "id": "food_bowl_bed",
            "label": "Food ($15) + Bowl ($5) + Bed ($20)",
            "icon": "🛏️",
            "cost": 40,
            "effect": "Food, bowl, and a cozy bed! Your puppy has a place to sleep! $10 left."
          },
          {
            "id": "basics_only",
            "label": "Just food ($15) + Bowl ($5)",
            "icon": "🍽️",
            "cost": 20,
            "effect": "The essentials are covered! You have $30 left for other things!"
          }
        ]
      },
      {
        "description": "Your puppy needs a vet visit for a checkup. It costs $25. Do you have enough?",
        "event_type": "choice",
        "choices": [
          {
            "id": "vet_yes",
            "label": "Take puppy to the vet",
            "icon": "🏥",
            "cost": 25,
            "effect": "Your puppy got a clean bill of health! Taking care of your pet is important!"
          },
          {
            "id": "vet_save",
            "label": "Save up more first",
            "icon": "🐷",
            "cost": 0,
            "effect": "You'll save up for the vet visit. Let's plan when you can go!"
          }
        ]
      },
      {
        "description": "Your puppy chewed up their toy! A new toy costs $8, but your friend has a gently used one for $3.",
        "event_type": "choice",
        "choices": [
          {
            "id": "new_toy",
            "label": "Buy a brand new toy",
            "icon": "🆕",
            "cost": 8,
            "effect": "A shiny new toy! Your puppy loves it!"
          },
          {
            "id": "used_toy",
            "label": "Get the used toy from your friend",
            "icon": "♻️",
            "cost": 3,
            "effect": "Your puppy doesn't care if it's used — they love it! And you saved $5!"
          },
          {
            "id": "diy_toy",
            "label": "Make a toy from old socks",
            "icon": "🧦",
            "cost": 0,
            "effect": "Your puppy thinks the sock toy is the best thing ever! Creative and free!"
          }
        ]
      }
    ],
    "recap_template": "You learned how to budget for a pet! Pets need food, vet visits, and toys — some costs happen once and others come back again and again.",
    "positive_framing_rules": [
      "Never say the student is unable to care for their pet",
      "Frame budget limits as planning opportunities",
      "Celebrate creative solutions like DIY toys"
    ],
    "ai_variation_allowed": [
      "Change the type of pet",
      "Add surprise puppy moments",
      "Vary the specific supply options"
    ],
    "max_turns": 12
  },
  {
    "id": "tier2_garage_sale",
    "title": "Garage Sale",
    "tier": 2,
    "domain": "money",
    "icon": "🏷️",
    "learning_objectives": [
      "Decide what things are worth",
      "Set fair prices for items",
      "Track earnings from sales"
    ],
    "initial_state": {
      "wallet": 0,
      "currency": "dollars",
      "items_to_sell": 8,
      "earnings": 0
    },
    "events": [
      {
        "description": "You're having a garage sale! You found old toys, books, and games to sell. First, you need to set prices. How do you price your old board game?",
        "event_type": "choice",
        "choices": [
          {
            "id": "game_high",
            "label": "$5 — it's in great shape!",
            "icon": "🎲",
            "cost": null,
            "effect": "A fair price! It takes a while but someone buys it for $5!"
          },
          {
            "id": "game_low",
            "label": "$2 — sell it fast!",
            "icon": "💨",
            "cost": null,
            "effect": "It sold right away! Quick sale for $2!"
          },
          {
            "id": "game_negotiate",
            "label": "$4 but willing to go lower",
            "icon": "🤝",
            "cost": null,
            "effect": "A customer offers $3 and you agree! Nice negotiating!"
          }
        ]
      },
      {
        "description": "A kid your age comes by and really wants your old bike. You were thinking $15. They only have $10.",
        "event_type": "choice",
        "choices": [
          {
            "id": "sell_10",
            "label": "Sell it for $10",
            "icon": "🚲",
            "cost": null,
            "effect": "The kid is thrilled! $10 is still great earnings!"
          },
          {
            "id": "hold_price",
            "label": "Wait for someone who'll pay $15",
            "icon": "⏳",
            "cost": null,
            "effect": "Later, an adult buys it for $15! Patience paid off!"
          },
          {
            "id": "trade",
            "label": "Trade for their skateboard + $5",
            "icon": "🛹",
            "cost": null,
            "effect": "A trade and some cash! Creative deal-making!"
          }
        ]
      },
      {
        "description": "The sale is almost over. You have a few items left. A neighbor offers to buy everything remaining for $8 total.",
        "event_type": "choice",
        "choices": [
          {
            "id": "bulk_deal",
            "label": "Take the $8 deal",
            "icon": "💰",
            "cost": null,
            "effect": "Everything sold! Your table is clear and you earned $8 more!"
          },
          {
            "id": "donate",
            "label": "Donate the rest",
            "icon": "🎁",
            "cost": null,
            "effect": "You donate the leftovers to a charity shop. So generous!"
          }
        ]
      },
      {
        "description": "Time to count your earnings! What do you want to do with the money you made?",
        "event_type": "choice",
        "choices": [
          {
            "id": "save_half",
            "label": "Save half, spend half",
            "icon": "⚖️",
            "cost": null,
            "effect": "A balanced plan! Some for fun now and some for later!"
          },
          {
            "id": "save_all",
            "label": "Save it all for something big",
            "icon": "🐷",
            "cost": null,
            "effect": "All saved! You're on your way to something awesome!"
          },
          {
            "id": "spend_now",
            "label": "Buy something fun right away",
            "icon": "🎉",
            "cost": null,
            "effect": "You treated yourself! You earned it!"
          }
        ]
      }
    ],
    "recap_template": "You ran a garage sale! You set prices, negotiated with customers, and decided what to do with your earnings. Great business skills!",
    "positive_framing_rules": [
      "Never say the student priced things wrong",
      "Celebrate negotiation and generosity equally",
      "Frame all earning outcomes positively"
    ],
    "ai_variation_allowed": [
      "Change the items being sold",
      "Add different types of customers",
      "Vary the negotiation scenarios"
    ],
    "max_turns": 12
  },
  {
    "id": "tier2_plan_playdate",
    "title": "Plan a Playdate",
    "tier": 2,
    "domain": "social",
    "icon": "🎮",
    "learning_objectives": [
      "Plan activities together with a friend",
      "Handle disagreements respectfully",
      "Practice collaborative decision-making"
    ],
    "initial_state": {
      "friend": "Alex",
      "hours_available": 3,
      "location": "your house"
    },
    "events": [
      {
        "description": "Your friend Alex is coming over for 3 hours! You want to play video games but Alex wants to play outside. How do you figure it out?",
        "event_type": "choice",
        "choices": [
          {
            "id": "compromise",
            "label": "Do both — 1.5 hours each!",
            "icon": "⚖️",
            "cost": null,
            "effect": "Great compromise! You both get to do what you love!"
          },
          {
            "id": "guest_picks",
            "label": "Let Alex pick since they're the guest",
            "icon": "🏠",
            "cost": null,
            "effect": "What a thoughtful host! Alex feels so welcome!"
          },
          {
            "id": "new_idea",
            "label": "Think of something you both like",
            "icon": "💡",
            "cost": null,
            "effect": "You came up with a board game you both love! Creative problem solving!"
          }
        ]
      },
      {
        "description": "You're having a great time! But Alex accidentally knocks over your favorite building block tower. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "its_ok",
            "label": "Say 'It's okay, accidents happen!'",
            "icon": "😊",
            "cost": null,
            "effect": "Alex feels better right away. You can rebuild it together!"
          },
          {
            "id": "rebuild_together",
            "label": "Ask Alex to help rebuild it",
            "icon": "🏗️",
            "cost": null,
            "effect": "Building it together makes it even better than before!"
          },
          {
            "id": "take_a_break",
            "label": "Take a deep breath, then decide",
            "icon": "🌬️",
            "cost": null,
            "effect": "Taking a moment to calm down is really mature! Then you figured out what to do next."
          }
        ]
      },
      {
        "description": "It's snack time! You have two choices in the kitchen. Alex has a food allergy and one option might not work for them.",
        "event_type": "choice",
        "choices": [
          {
            "id": "ask_first",
            "label": "Ask Alex what they can eat",
            "icon": "❓",
            "cost": null,
            "effect": "Asking first is so considerate! Alex tells you what works and you both enjoy a snack!"
          },
          {
            "id": "safe_option",
            "label": "Pick the option that works for everyone",
            "icon": "✅",
            "cost": null,
            "effect": "You picked the safe choice! Being thoughtful about friends' needs is really kind!"
          }
        ]
      }
    ],
    "recap_template": "You planned a great playdate! You practiced compromising, handling accidents calmly, and being thoughtful about your friend's needs.",
    "positive_framing_rules": [
      "Never frame disagreements as fights or conflicts",
      "Celebrate all conflict resolution approaches",
      "Model kindness and consideration in all options"
    ],
    "ai_variation_allowed": [
      "Change the friend's name and preferences",
      "Vary the activities available",
      "Add a surprise fun moment during the playdate"
    ],
    "max_turns": 10
  },
  {
    "id": "tier2_team_decision",
    "title": "Team Decision",
    "tier": 2,
    "domain": "social",
    "icon": "🤝",
    "learning_objectives": [
      "Listen to different opinions",
      "Find fair solutions when people disagree",
      "Practice group decision-making"
    ],
    "initial_state": {
      "team_size": 4,
      "options": 3,
      "location": "classroom"
    },
    "events": [
      {
        "description": "Your class team needs to pick a project topic. Sam wants animals, Jordan wants space, and Taylor wants dinosaurs. You're the tiebreaker! How do you decide?",
        "event_type": "choice",
        "choices": [
          {
            "id": "vote",
            "label": "Take a vote — everyone picks!",
            "icon": "🗳️",
            "cost": null,
            "effect": "A fair vote! The team agrees to go with the winner. Democracy in action!"
          },
          {
            "id": "combine",
            "label": "Combine ideas — animals in space!",
            "icon": "🚀🐕",
            "cost": null,
            "effect": "Creative! The team loves the mash-up idea! Everyone's idea is included!"
          },
          {
            "id": "discuss",
            "label": "Discuss why each person likes their topic",
            "icon": "💬",
            "cost": null,
            "effect": "Great listening! After hearing reasons, the team finds an idea everyone's excited about!"
          }
        ]
      },
      {
        "description": "The team is working on the project. One person is doing more work than others. What do you suggest?",
        "event_type": "choice",
        "choices": [
          {
            "id": "split_tasks",
            "label": "Split the work into equal parts",
            "icon": "📋",
            "cost": null,
            "effect": "Everyone has a clear job now! The workload is fair and balanced!"
          },
          {
            "id": "check_in",
            "label": "Ask if anyone needs help",
            "icon": "🤝",
            "cost": null,
            "effect": "Turns out someone was stuck! Now that they have help, everyone's contributing!"
          },
          {
            "id": "play_strengths",
            "label": "Let people do what they're best at",
            "icon": "⭐",
            "cost": null,
            "effect": "Sam draws, Jordan writes, Taylor researches, and you organize! Everyone shines!"
          }
        ]
      },
      {
        "description": "Presentation day! The team is nervous. How do you help everyone feel ready?",
        "event_type": "choice",
        "choices": [
          {
            "id": "practice",
            "label": "Practice together one more time",
            "icon": "🎭",
            "cost": null,
            "effect": "Practice makes confident! The whole team feels ready!"
          },
          {
            "id": "encourage",
            "label": "Tell everyone they did great work",
            "icon": "💪",
            "cost": null,
            "effect": "Your encouragement boosts everyone's confidence! Team spirit!"
          }
        ]
      }
    ],
    "recap_template": "You helped your team make decisions, share work fairly, and support each other. Those are amazing teamwork skills!",
    "positive_framing_rules": [
      "Never label any team member as lazy or unhelpful",
      "Celebrate all approaches to group work",
      "Frame disagreements as opportunities to find better solutions"
    ],
    "ai_variation_allowed": [
      "Change the project topic options",
      "Vary the team member personalities",
      "Add a surprise challenge during the project"
    ],
    "max_turns": 10
  },
  {
    "id": "tier2_goal_tracker",
    "title": "Goal Tracker",
    "tier": 2,
    "domain": "social",
    "icon": "🎯",
    "learning_objectives": [
      "Set a realistic weekly goal",
      "Check in on progress each day",
      "Learn that setbacks are part of the process"
    ],
    "initial_state": {
      "goal": null,
      "day": 1,
      "total_days": 5,
      "progress": 0
    },
    "events": [
      {
        "description": "Let's set a goal for this week! What would you like to work on?",
        "event_type": "choice",
        "choices": [
          {
            "id": "reading_goal",
            "label": "Read for 20 minutes every day",
            "icon": "📖",
            "cost": null,
            "effect": "Great goal! Reading every day builds your imagination and vocabulary!"
          },
          {
            "id": "kindness_goal",
            "label": "Do one kind thing every day",
            "icon": "💛",
            "cost": null,
            "effect": "A kindness goal! The world could use more kindness. Love it!"
          },
          {
            "id": "exercise_goal",
            "label": "Play outside for 30 minutes daily",
            "icon": "🏃",
            "cost": null,
            "effect": "Active goal! Moving your body gives you energy and makes you feel great!"
          }
        ]
      },
      {
        "description": "Day 3! You've been doing great, but today was really busy and you almost forgot about your goal. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "do_it_anyway",
            "label": "Do it even though you're tired",
            "icon": "💪",
            "cost": null,
            "effect": "You pushed through! Even a little bit of effort counts!"
          },
          {
            "id": "smaller_version",
            "label": "Do a smaller version today",
            "icon": "📏",
            "cost": null,
            "effect": "10 minutes instead of 20 still counts! Adjusting your plan is smart!"
          },
          {
            "id": "skip_today",
            "label": "Skip today, do extra tomorrow",
            "icon": "📅",
            "cost": null,
            "effect": "One day off is totally fine! You can catch up tomorrow!"
          }
        ]
      },
      {
        "description": "It's Day 5 — the last day of your goal week! How do you feel about what you accomplished?",
        "event_type": "choice",
        "choices": [
          {
            "id": "celebrate",
            "label": "Celebrate! I did my best!",
            "icon": "🎉",
            "cost": null,
            "effect": "You should be so proud! Sticking with a goal for a whole week is amazing!"
          },
          {
            "id": "set_new_goal",
            "label": "Set an even bigger goal for next week!",
            "icon": "🚀",
            "cost": null,
            "effect": "Level up! Your confidence is growing along with your skills!"
          }
        ]
      }
    ],
    "recap_template": "You set a goal and tracked it for a whole week! You learned that goals take daily effort, and it's okay to adjust along the way.",
    "positive_framing_rules": [
      "Never say the student gave up or quit",
      "Frame missed days as normal and recoverable",
      "Celebrate effort and persistence, not perfection"
    ],
    "ai_variation_allowed": [
      "Change the specific goal options",
      "Add surprise challenges or motivating moments",
      "Vary the day-by-day check-in scenarios"
    ],
    "max_turns": 10
  },
  {
    "id": "tier2_plan_school_day",
    "title": "Plan My School Day",
    "tier": 2,
    "domain": "time",
    "icon": "📅",
    "learning_objectives": [
      "Block out time for different activities",
      "Balance homework, play, and chores",
      "Practice visual scheduling"
    ],
    "initial_state": {
      "hours_available": 6,
      "tasks": [
        "homework",
        "play",
        "chores",
        "reading"
      ],
      "location": "home after school"
    },
    "events": [
      {
        "description": "You're home from school and have 6 hours before bedtime! You need to do homework (1 hour), chores (30 min), and you want to play and read. What do you do first?",
        "event_type": "choice",
        "choices": [
          {
            "id": "homework_first",
            "label": "Homework first, play later",
            "icon": "📝",
            "cost": null,
            "effect": "Homework done! Now you can relax without worrying about it!"
          },
          {
            "id": "play_first",
            "label": "Play first while you have energy",
            "icon": "⚽",
            "cost": null,
            "effect": "Fun time first! You played hard and now you're ready to focus!"
          },
          {
            "id": "chores_first",
            "label": "Quick chores to get them done",
            "icon": "🧹",
            "cost": null,
            "effect": "Chores done in 30 minutes! Nice work getting them out of the way!"
          }
        ]
      },
      {
        "description": "You've done one thing. Now your friend calls and wants to video chat for 30 minutes. How do you fit it in?",
        "event_type": "choice",
        "choices": [
          {
            "id": "chat_now",
            "label": "Chat now, do other stuff after",
            "icon": "📱",
            "cost": null,
            "effect": "Great chat with your friend! Now back to your plan!"
          },
          {
            "id": "chat_later",
            "label": "Ask to chat after homework",
            "icon": "⏰",
            "cost": null,
            "effect": "Your friend says sure! Now you can look forward to it!"
          },
          {
            "id": "short_chat",
            "label": "Chat for 15 min instead of 30",
            "icon": "⏱️",
            "cost": null,
            "effect": "A quick catch-up! You saved time and still talked to your friend!"
          }
        ]
      },
      {
        "description": "It's getting close to dinner. You still have reading and one more activity to fit in. Let's plan!",
        "event_type": "choice",
        "choices": [
          {
            "id": "read_then_play",
            "label": "Read now, play after dinner",
            "icon": "📖",
            "cost": null,
            "effect": "Quiet reading time before dinner is so peaceful!"
          },
          {
            "id": "play_then_read",
            "label": "Play now, read before bed",
            "icon": "🏃",
            "cost": null,
            "effect": "Active time before dinner, then a calm book before bed. Nice flow!"
          }
        ]
      }
    ],
    "recap_template": "You planned your whole after-school day! You fit in homework, chores, play, reading, and friend time. That's great scheduling!",
    "positive_framing_rules": [
      "Never say the student is wasting time",
      "Celebrate all scheduling approaches as valid",
      "Frame planning as empowering, not restrictive"
    ],
    "ai_variation_allowed": [
      "Change the specific activities available",
      "Add a surprise event like a package delivery",
      "Vary the friend interaction scenarios"
    ],
    "max_turns": 12
  },
  {
    "id": "tier2_homework_scheduler",
    "title": "Homework Scheduler",
    "tier": 2,
    "domain": "time",
    "icon": "📝",
    "learning_objectives": [
      "Estimate how long tasks take",
      "Plan the order of assignments",
      "Learn to tackle big tasks in pieces"
    ],
    "initial_state": {
      "assignments": 4,
      "hours_available": 3,
      "location": "desk at home"
    },
    "events": [
      {
        "description": "You have 4 assignments tonight: Math (30 min), Reading (20 min), Spelling words (15 min), and a Science drawing (45 min). You have 3 hours. What do you start with?",
        "event_type": "choice",
        "choices": [
          {
            "id": "hardest_first",
            "label": "Science drawing — biggest one first!",
            "icon": "🔬",
            "cost": null,
            "effect": "Tackling the big one first! Smart strategy — now everything else feels quick!"
          },
          {
            "id": "easiest_first",
            "label": "Spelling — quick win!",
            "icon": "🔤",
            "cost": null,
            "effect": "Done in 15 minutes! One down, three to go! Nice momentum!"
          },
          {
            "id": "favorite_first",
            "label": "Math — your favorite subject",
            "icon": "🔢",
            "cost": null,
            "effect": "Starting with what you enjoy! You zoomed right through it!"
          }
        ]
      },
      {
        "description": "One assignment done! You're feeling good. But you realize the science drawing might take longer than you thought. What's your plan?",
        "event_type": "choice",
        "choices": [
          {
            "id": "do_science_now",
            "label": "Do science next while you're focused",
            "icon": "🎨",
            "cost": null,
            "effect": "Good thinking! You gave the big project your best focus time!"
          },
          {
            "id": "quick_ones",
            "label": "Knock out the quick ones first",
            "icon": "⚡",
            "cost": null,
            "effect": "Two more done! Now you can give science all your attention!"
          },
          {
            "id": "break_first",
            "label": "Take a 10-minute break, then science",
            "icon": "☕",
            "cost": null,
            "effect": "A short break refreshed your brain! Now you're ready for the big one!"
          }
        ]
      },
      {
        "description": "You're on your last assignment! But your favorite show is about to start. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "finish_first",
            "label": "Finish homework, watch show later",
            "icon": "✅",
            "cost": null,
            "effect": "All done! Now you can watch your show with zero worries!"
          },
          {
            "id": "record_show",
            "label": "Record the show, finish homework",
            "icon": "⏺️",
            "cost": null,
            "effect": "Great idea! You can watch it anytime after homework is done!"
          }
        ]
      }
    ],
    "recap_template": "You scheduled all 4 assignments and finished them! You learned about estimating time, picking an order, and staying on track.",
    "positive_framing_rules": [
      "Never say the student is behind or running out of time",
      "Celebrate all approaches to task ordering",
      "Frame breaks as a healthy part of studying"
    ],
    "ai_variation_allowed": [
      "Change the specific homework subjects",
      "Add a surprise easy or fun assignment",
      "Vary the time estimates slightly"
    ],
    "max_turns": 12
  },
  {
    "id": "tier2_weekend_planner",
    "title": "Weekend Planner",
    "tier": 2,
    "domain": "time",
    "icon": "🗓️",
    "learning_objectives": [
      "Fit activities into time slots",
      "Handle conflicts when two things overlap",
      "Practice planning a full day"
    ],
    "initial_state": {
      "day": "Saturday",
      "hours_available": 8,
      "activities_planned": 0
    },
    "events": [
      {
        "description": "It's Saturday! You have the whole day from 9 AM to 5 PM. Soccer practice is at 10 AM (1 hour). Your grandma invited you for lunch at noon. What do you want to do in the morning before soccer?",
        "event_type": "choice",
        "choices": [
          {
            "id": "cartoons",
            "label": "Watch cartoons 9-10 AM",
            "icon": "📺",
            "cost": null,
            "effect": "Cartoons before soccer! A relaxing start to Saturday!"
          },
          {
            "id": "bike_ride",
            "label": "Bike ride 9-10 AM",
            "icon": "🚲",
            "cost": null,
            "effect": "A morning bike ride! You're warmed up for soccer!"
          },
          {
            "id": "clean_room",
            "label": "Clean your room 9-10 AM",
            "icon": "🧹",
            "cost": null,
            "effect": "Room is clean! Now the rest of the day is all fun!"
          }
        ]
      },
      {
        "description": "Soccer is done at 11 AM and lunch with grandma is at noon. You have one free hour! Your friend also wants to meet at the park at 11 AM. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "park_quick",
            "label": "Park for 45 min, then head to grandma's",
            "icon": "🏞️",
            "cost": null,
            "effect": "Quick park hangout! You made it to grandma's right on time!"
          },
          {
            "id": "rest_up",
            "label": "Rest and shower before lunch",
            "icon": "🚿",
            "cost": null,
            "effect": "Freshened up after soccer! Grandma loves seeing you looking sharp!"
          },
          {
            "id": "friend_lunch",
            "label": "Ask if your friend can come to grandma's",
            "icon": "👫",
            "cost": null,
            "effect": "Grandma says yes! The more the merrier!"
          }
        ]
      },
      {
        "description": "After lunch, you have 2-5 PM free. There's a movie at 3 PM (2 hours) OR you could go swimming (1 hour) AND do a craft project (1 hour). What's your plan?",
        "event_type": "choice",
        "choices": [
          {
            "id": "movie",
            "label": "Movie from 3-5 PM",
            "icon": "🎬",
            "cost": null,
            "effect": "Great movie! The perfect way to end your Saturday!"
          },
          {
            "id": "swim_craft",
            "label": "Swimming then craft project",
            "icon": "🏊",
            "cost": null,
            "effect": "Swimming AND crafts! You fit two fun things into the afternoon!"
          },
          {
            "id": "free_play",
            "label": "Just hang out and see what happens",
            "icon": "🌈",
            "cost": null,
            "effect": "Sometimes the best plans are no plans! You had a spontaneous adventure!"
          }
        ]
      }
    ],
    "recap_template": "You planned an awesome Saturday! You fit in sports, family time, friends, and fun activities. That's some great time management!",
    "positive_framing_rules": [
      "Never say the student wasted their weekend",
      "Celebrate both structured and spontaneous plans",
      "Frame time conflicts as puzzles to solve, not problems"
    ],
    "ai_variation_allowed": [
      "Change the specific activities available",
      "Add weather-related changes",
      "Vary the family member or friend scenarios"
    ],
    "max_turns": 12
  },
  {
    "id": "tier3_school_fair_booth",
    "title": "Run a School Fair Booth",
    "tier": 3,
    "domain": "combo",
    "icon": "🎪",
    "learning_objectives": [
      "Budget for booth supplies and inventory",
      "Schedule shifts for team members",
      "Plan a snack menu with energy-giving options",
      "Make team decisions and handle customer interactions"
    ],
    "initial_state": {
      "wallet": 100,
      "currency": "dollars",
      "team_size": 5,
      "hours": 6,
      "location": "school fair"
    },
    "events": [
      {
        "description": "Your team is running a booth at the school fair! You have $100 and 6 hours. First, what kind of booth? Each option has different costs and earning potential.",
        "event_type": "choice",
        "choices": [
          {
            "id": "food_booth",
            "label": "Snack booth — fruit cups + lemonade ($60 supplies, high demand)",
            "icon": "🍋",
            "cost": 60,
            "effect": "Food always sells! $60 invested, high earning potential. $40 left for other needs."
          },
          {
            "id": "game_booth",
            "label": "Game booth — ring toss + prizes ($45 supplies, steady demand)",
            "icon": "🎯",
            "cost": 45,
            "effect": "Games attract a crowd! $45 in supplies, $55 left. Prizes cost less than food."
          },
          {
            "id": "combo_booth",
            "label": "Games + small snacks ($80 supplies, highest potential)",
            "icon": "🎯🍋",
            "cost": 80,
            "effect": "Double the fun! More setup but more ways to earn. $20 left for emergencies."
          }
        ]
      },
      {
        "description": "Time to schedule 6 hours of shifts for your 5 team members. Everyone needs at least one break. Two people at the booth at all times. How do you organize it?",
        "event_type": "choice",
        "choices": [
          {
            "id": "rotating_pairs",
            "label": "Rotating pairs — everyone works 3 hours with breaks",
            "icon": "🔄",
            "cost": null,
            "effect": "Fair rotation! Everyone works the same amount and gets breaks."
          },
          {
            "id": "skill_based",
            "label": "Match people to roles — cashier, server, promoter",
            "icon": "👥",
            "cost": null,
            "effect": "Specialized roles! The outgoing person promotes, the organized one handles money."
          },
          {
            "id": "flexible",
            "label": "Flexible sign-up — people pick their preferred hours",
            "icon": "📋",
            "cost": null,
            "effect": "People work when they're most available! Some flexibility needed for gaps."
          }
        ]
      },
      {
        "description": "Midway through the fair, you're running low on supplies. You've earned $75 so far. The supply store nearby has what you need for $25. But a teammate wants to use the $25 to buy prizes for a raffle.",
        "event_type": "choice",
        "choices": [
          {
            "id": "restock",
            "label": "Restock supplies — keep earning",
            "icon": "📦",
            "cost": 25,
            "effect": "Smart reinvestment! You restock and earn another $50 by the end of the fair."
          },
          {
            "id": "raffle",
            "label": "Raffle — one big draw at the end",
            "icon": "🎟️",
            "cost": 25,
            "effect": "The raffle creates excitement! People buy tickets and it draws a crowd."
          },
          {
            "id": "split_budget",
            "label": "Split — $15 restock, $10 raffle prizes",
            "icon": "⚖️",
            "cost": 25,
            "effect": "A balanced approach! Partial restock AND a smaller raffle. Both strategies in play!"
          }
        ]
      },
      {
        "description": "A parent complains that the prices are too high. A younger kid is upset because they didn't win a prize. Two situations at once! How does your team handle it?",
        "event_type": "choice",
        "choices": [
          {
            "id": "delegate",
            "label": "You handle the parent, teammate helps the kid",
            "icon": "🤝",
            "cost": null,
            "effect": "Team delegation! You calmly explain pricing while your teammate gives the kid a participation sticker."
          },
          {
            "id": "discount_consolation",
            "label": "Offer a small discount + a 'try again free' coupon",
            "icon": "🎫",
            "cost": null,
            "effect": "Customer service! The parent feels heard and the kid gets another chance. Both leave happy."
          },
          {
            "id": "team_huddle",
            "label": "Quick team huddle — decide together",
            "icon": "🏈",
            "cost": null,
            "effect": "30-second team meeting! You agree on a response and everyone's on the same page."
          }
        ]
      },
      {
        "description": "Fair's over! Time to count earnings and split any profits. Your team earned $150 total, spent $100 on supplies. That's $50 profit for 5 people.",
        "event_type": "choice",
        "choices": [
          {
            "id": "equal_split",
            "label": "Split equally — $10 each",
            "icon": "💰",
            "cost": null,
            "effect": "Fair and simple! Everyone gets $10 for their hard work."
          },
          {
            "id": "donate",
            "label": "Donate profits to a school cause",
            "icon": "🎁",
            "cost": null,
            "effect": "The team votes to donate! The school thanks you and everyone feels great about giving back."
          },
          {
            "id": "reinvest",
            "label": "Save it for the next school event booth",
            "icon": "🐷",
            "cost": null,
            "effect": "Reinvesting! Next time you'll start with $50 and need less startup money."
          }
        ]
      }
    ],
    "recap_template": "You ran a school fair booth from start to finish! You managed money, scheduled a team, served customers, and handled surprises. That's real-world leadership across all four life skills!",
    "positive_framing_rules": [
      "Never say the booth was unsuccessful or poorly managed",
      "Frame customer complaints as learning opportunities",
      "Celebrate teamwork and adaptability"
    ],
    "ai_variation_allowed": [
      "Change the booth type",
      "Vary the customer scenarios",
      "Add weather or supply challenges"
    ],
    "max_turns": 18
  },
  {
    "id": "tier3_nutrition_label",
    "title": "Nutrition Label Detective",
    "tier": 3,
    "domain": "health",
    "icon": "🔍",
    "learning_objectives": [
      "Read and compare nutrition labels",
      "Understand serving sizes and daily values",
      "Make informed choices using label data"
    ],
    "initial_state": {
      "items_to_compare": 3,
      "location": "grocery store"
    },
    "events": [
      {
        "description": "You're at the grocery store comparing two cereals. Cereal A: 120 calories, 12g sugar, 3g fiber per serving. Cereal B: 150 calories, 6g sugar, 8g fiber per serving. Cereal A costs $3, Cereal B costs $4. Which gives you more lasting energy?",
        "event_type": "choice",
        "choices": [
          {
            "id": "cereal_b",
            "label": "Cereal B — more fiber, less sugar",
            "icon": "🥣",
            "cost": 4,
            "effect": "Fiber keeps you full longer! Cereal B has less sugar too. Great label reading!"
          },
          {
            "id": "cereal_a",
            "label": "Cereal A — fewer calories, lower cost",
            "icon": "🥣",
            "cost": 3,
            "effect": "Budget-friendly choice! Sometimes the simpler option works great."
          },
          {
            "id": "mix_both",
            "label": "Get both and mix them!",
            "icon": "🥣🥣",
            "cost": 7,
            "effect": "Creative! Mixing gives you the taste you like with extra fiber."
          }
        ]
      },
      {
        "description": "Juice aisle! Orange Juice A says '100% juice' with 22g sugar per serving. Orange Juice B says 'juice drink' with 15g sugar but only 20% real juice. Which label tells you more?",
        "event_type": "choice",
        "choices": [
          {
            "id": "oj_100",
            "label": "100% juice — natural sugar from oranges",
            "icon": "🍊",
            "cost": null,
            "effect": "The sugar in 100% juice comes from the fruit itself. Label knowledge!"
          },
          {
            "id": "oj_less_sugar",
            "label": "Juice drink — less sugar overall",
            "icon": "🧃",
            "cost": null,
            "effect": "Less sugar per serving is worth noting! But check what replaces the juice."
          },
          {
            "id": "water_instead",
            "label": "Just grab water — no label needed!",
            "icon": "💧",
            "cost": null,
            "effect": "Water is always a great choice! Zero sugar and your body loves it."
          }
        ]
      },
      {
        "description": "Snack comparison! Trail mix A: serving size 1/4 cup (140 cal, 9g protein). Trail mix B: serving size 1/2 cup (250 cal, 6g protein). Which is a better value per serving?",
        "event_type": "choice",
        "choices": [
          {
            "id": "trail_a",
            "label": "Trail Mix A — more protein per calorie",
            "icon": "🥜",
            "cost": null,
            "effect": "Great catch! Same amount gives you more protein and fewer calories. Label detective!"
          },
          {
            "id": "trail_b",
            "label": "Trail Mix B — bigger serving size",
            "icon": "🥜",
            "cost": null,
            "effect": "The bigger serving means more food, but check the protein-to-calorie ratio!"
          },
          {
            "id": "per_cup",
            "label": "Calculate per cup to compare fairly",
            "icon": "🧮",
            "cost": null,
            "effect": "Brilliant! Normalizing to the same serving size makes a fair comparison. Trail A: 560cal/36g protein per cup vs Trail B: 500cal/12g. A wins on protein!"
          }
        ]
      },
      {
        "description": "Last challenge: a food claims 'low fat' on the front, but the nutrition label shows 8g of added sugar per serving. The regular version has 5g fat but only 2g sugar. What did you learn?",
        "event_type": "choice",
        "choices": [
          {
            "id": "check_labels",
            "label": "Front labels can be misleading — always check the back!",
            "icon": "🔍",
            "cost": null,
            "effect": "Exactly! Marketing claims on the front don't tell the whole story. The nutrition label does!"
          },
          {
            "id": "balance_matters",
            "label": "Reducing one thing sometimes increases another",
            "icon": "⚖️",
            "cost": null,
            "effect": "Great insight! 'Low fat' doesn't mean better if sugar goes way up. Context matters!"
          },
          {
            "id": "compare_both",
            "label": "Compare total nutrition, not just one number",
            "icon": "📊",
            "cost": null,
            "effect": "Looking at the whole picture is the smartest approach! No single number tells the full story."
          }
        ]
      }
    ],
    "recap_template": "You became a nutrition label detective! You learned to compare serving sizes, spot marketing tricks, and use real data to make informed choices.",
    "positive_framing_rules": [
      "Never label foods as bad or junk food",
      "Focus on what nutrients do for your body, not calories",
      "Frame all choices as learning opportunities"
    ],
    "ai_variation_allowed": [
      "Change the specific products being compared",
      "Add real-world nutrition facts",
      "Include fun facts about nutrients"
    ],
    "max_turns": 15
  },
  {
    "id": "tier3_recipe_cost_calculator",
    "title": "Recipe Cost Calculator",
    "tier": 3,
    "domain": "health",
    "icon": "🧮",
    "learning_objectives": [
      "Calculate the cost of a recipe",
      "Find cheaper ingredient substitutions",
      "Balance nutrition and cost"
    ],
    "initial_state": {
      "wallet": 25,
      "currency": "dollars",
      "servings": 4,
      "location": "kitchen"
    },
    "events": [
      {
        "description": "You're making dinner for your family of 4! Chicken stir-fry recipe: chicken ($8), rice ($3), vegetables ($5), soy sauce ($4) = $20 total, or $5 per person. But you only have $15. What do you adjust?",
        "event_type": "choice",
        "choices": [
          {
            "id": "swap_protein",
            "label": "Use eggs ($3) instead of chicken ($8)",
            "icon": "🥚",
            "cost": null,
            "effect": "Eggs are a great protein swap! New total: $15. Fits the budget perfectly!"
          },
          {
            "id": "frozen_veggies",
            "label": "Use frozen veggies ($3) instead of fresh ($5)",
            "icon": "🥦",
            "cost": null,
            "effect": "Frozen veggies are just as nutritious and cheaper! New total: $18. Getting closer!"
          },
          {
            "id": "both_swaps",
            "label": "Eggs + frozen veggies — total under $15!",
            "icon": "💡",
            "cost": null,
            "effect": "Both swaps bring it to $13! Under budget with the same nutrition. Smart cooking!"
          }
        ]
      },
      {
        "description": "Your recipe serves 4, but your neighbor asks if they can join for dinner (now 5 people). You don't want to spend more money. How do you stretch the meal?",
        "event_type": "choice",
        "choices": [
          {
            "id": "more_rice",
            "label": "Add more rice — cheap and filling",
            "icon": "🍚",
            "cost": 1,
            "effect": "Extra rice stretches the meal! Cost per person drops from $3.25 to $2.80."
          },
          {
            "id": "add_beans",
            "label": "Add a can of beans for protein + volume",
            "icon": "🫘",
            "cost": 1,
            "effect": "Beans add protein and make the stir-fry heartier! Everyone gets a full plate."
          },
          {
            "id": "side_salad",
            "label": "Make a quick side salad from what you have",
            "icon": "🥗",
            "cost": 0,
            "effect": "A no-cost side! Lettuce, tomatoes, and dressing you already had. Resourceful!"
          }
        ]
      },
      {
        "description": "You want to make this recipe again next week but save even more. The store has bulk rice (5 lbs for $6 vs 1 lb for $3) and a family-pack of chicken ($15 for 3 meals vs $8 for 1 meal). What's the smart buy?",
        "event_type": "choice",
        "choices": [
          {
            "id": "bulk_both",
            "label": "Buy both in bulk — save over 3 weeks",
            "icon": "📦",
            "cost": 21,
            "effect": "Bulk rice + family chicken = $21 now but saves $12 over 3 weeks! Long-term thinking!"
          },
          {
            "id": "bulk_rice_only",
            "label": "Bulk rice only — less money upfront",
            "icon": "🍚",
            "cost": 6,
            "effect": "Bulk rice saves $3 over time. Smaller upfront cost keeps your budget flexible."
          },
          {
            "id": "no_bulk",
            "label": "Stick with regular sizes for now",
            "icon": "🛒",
            "cost": 11,
            "effect": "No extra spending right now! Sometimes staying flexible is the smart play."
          }
        ]
      }
    ],
    "recap_template": "You cooked dinner, managed a food budget, made smart substitutions, and learned about bulk buying! These are real skills for feeding yourself and others.",
    "positive_framing_rules": [
      "Never suggest the family can only afford certain foods",
      "Frame budget cooking as creative and smart, not restrictive",
      "Celebrate resourcefulness and nutrition equally"
    ],
    "ai_variation_allowed": [
      "Change the recipe and ingredients",
      "Vary the budget constraints",
      "Add nutrition tips alongside cost comparisons"
    ],
    "max_turns": 15
  },
  {
    "id": "tier3_meal_prep_challenge",
    "title": "Meal Prep Challenge",
    "tier": 3,
    "domain": "health",
    "icon": "🍱",
    "learning_objectives": [
      "Plan 5 dinners within a budget",
      "Hit nutrition targets across a week",
      "Make trade-offs between variety and cost"
    ],
    "initial_state": {
      "wallet": 60,
      "currency": "dollars",
      "days": 5,
      "servings_per_day": 4,
      "nutrition_targets": {
        "protein": true,
        "vegetables": true,
        "grains": true
      }
    },
    "events": [
      {
        "description": "Meal prep challenge! Plan 5 dinners for a family of 4 with $60. That's $12 per meal or $3 per plate. Monday: what's for dinner?",
        "event_type": "choice",
        "choices": [
          {
            "id": "pasta_night",
            "label": "Pasta with meat sauce + salad ($10)",
            "icon": "🍝",
            "cost": 10,
            "effect": "Pasta night! Grains, protein, and veggies covered. $50 remaining for 4 meals."
          },
          {
            "id": "rice_beans",
            "label": "Rice and beans with roasted veggies ($7)",
            "icon": "🍚",
            "cost": 7,
            "effect": "Affordable and complete! Protein from beans, grains from rice, plus veggies. $53 left!"
          },
          {
            "id": "soup",
            "label": "Homemade vegetable soup with bread ($8)",
            "icon": "🍲",
            "cost": 8,
            "effect": "Warm soup with lots of veggies! And it makes great leftovers. $52 remaining."
          }
        ]
      },
      {
        "description": "It's Wednesday and you've spent $25 so far. You have $35 left for 3 dinners. A friend gave you extra tomatoes and peppers from their garden — free veggies! How does this change your plan?",
        "event_type": "choice",
        "choices": [
          {
            "id": "use_free",
            "label": "Build meals around the free veggies",
            "icon": "🌶️",
            "cost": null,
            "effect": "Stuffed peppers and tomato sauce! Free ingredients lower your costs. Smart adaptation!"
          },
          {
            "id": "splurge_one",
            "label": "Save money on one meal, splurge on another",
            "icon": "✨",
            "cost": null,
            "effect": "Free veggie stir-fry Wednesday ($4) means you can do tacos Thursday ($14)! Strategic!"
          },
          {
            "id": "save_extra",
            "label": "Keep costs low and save the extra for next week",
            "icon": "💰",
            "cost": null,
            "effect": "Under budget! The extra money rolls into next week's meal plan."
          }
        ]
      },
      {
        "description": "Friday is the last dinner. You have $18 left. Your family wants something special but you also want to keep it balanced. What do you make?",
        "event_type": "choice",
        "choices": [
          {
            "id": "homemade_pizza",
            "label": "Homemade pizza night ($12) — everyone picks toppings",
            "icon": "🍕",
            "cost": 12,
            "effect": "Pizza night! Veggies, cheese, and whole wheat dough. Fun AND nutritious. $6 saved!"
          },
          {
            "id": "taco_bar",
            "label": "Taco bar ($15) — build your own!",
            "icon": "🌮",
            "cost": 15,
            "effect": "Tacos with beans, veggies, cheese, and salsa! Interactive dinner. $3 left!"
          },
          {
            "id": "stir_fry_fancy",
            "label": "Fancy stir-fry with shrimp ($18)",
            "icon": "🍤",
            "cost": 18,
            "effect": "A special end to the week! Shrimp is a great protein. You used exactly your budget!"
          }
        ]
      },
      {
        "description": "Week's done! Let's review: did your meals cover all the nutrition targets across the 5 days?",
        "event_type": "choice",
        "choices": [
          {
            "id": "review_proud",
            "label": "Every meal had protein, veggies, and grains!",
            "icon": "✅",
            "cost": null,
            "effect": "Balanced every single day! Your family got great nutrition all week."
          },
          {
            "id": "review_improve",
            "label": "I could add more variety next week",
            "icon": "📝",
            "cost": null,
            "effect": "Self-reflection! Noticing where to improve is a sign of a great planner."
          },
          {
            "id": "review_budget",
            "label": "I stayed under budget — more to save!",
            "icon": "💪",
            "cost": null,
            "effect": "Under budget AND well-fed! Those are real-world cooking skills."
          }
        ]
      }
    ],
    "recap_template": "You planned 5 dinners for a family of 4 within a $60 budget! You balanced nutrition, cost, and variety. Meal planning is a skill that saves money and keeps you energized.",
    "positive_framing_rules": [
      "Never suggest the budget is too tight or meals are inadequate",
      "Frame budget cooking as creative and empowering",
      "Use 'energy-giving' language for nutrition, not calorie-counting"
    ],
    "ai_variation_allowed": [
      "Change the specific meals and ingredients",
      "Add seasonal ingredient availability",
      "Include nutrition tips about food groups"
    ],
    "max_turns": 15
  },
  {
    "id": "tier3_school_dance_budget",
    "title": "School Dance Budget",
    "tier": 3,
    "domain": "money",
    "icon": "💃",
    "learning_objectives": [
      "Manage a multi-category budget",
      "Handle unexpected expenses",
      "Make trade-offs between categories"
    ],
    "initial_state": {
      "wallet": 50,
      "currency": "dollars",
      "categories": {
        "decorations": 0,
        "snacks": 0,
        "music": 0,
        "supplies": 0
      }
    },
    "events": [
      {
        "description": "You're in charge of the school dance budget — $50 total! You need decorations, snacks, and music. The DJ app costs $10, basic decorations are $15, and snacks for 30 people cost $20. That's $45 — leaving only $5 for extras. How do you allocate?",
        "event_type": "choice",
        "choices": [
          {
            "id": "balanced",
            "label": "DJ ($10) + Decor ($15) + Snacks ($20) + $5 buffer",
            "icon": "⚖️",
            "cost": 45,
            "effect": "A balanced plan with a small buffer! Smart to keep $5 for surprises."
          },
          {
            "id": "upgrade_music",
            "label": "Better DJ ($20) + Basic decor ($10) + Snacks ($20)",
            "icon": "🎵",
            "cost": 50,
            "effect": "Great music can make the dance! You spent it all but the vibe will be amazing."
          },
          {
            "id": "diy_decor",
            "label": "DJ ($10) + DIY decor ($5) + Snacks ($20) + $15 buffer",
            "icon": "✂️",
            "cost": 35,
            "effect": "DIY decorations save money! You have $15 for unexpected needs. Resourceful!"
          }
        ]
      },
      {
        "description": "Surprise! The snack prices went up by 15%. Your $20 snack budget now covers fewer items. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "use_buffer",
            "label": "Use your buffer money for snacks",
            "icon": "💰",
            "cost": null,
            "effect": "Good thing you planned ahead! The buffer covers the price increase."
          },
          {
            "id": "fewer_snacks",
            "label": "Buy fewer but better snacks",
            "icon": "🍕",
            "cost": null,
            "effect": "Quality over quantity! Fewer items but everyone loves them."
          },
          {
            "id": "ask_donations",
            "label": "Ask classmates to bring a snack each",
            "icon": "🤝",
            "cost": null,
            "effect": "Potluck style! Everyone contributes and you save money. Community solution!"
          }
        ]
      },
      {
        "description": "A classmate suggests adding a photo booth. A DIY version costs $8, a fancy rental costs $25. Is it worth it?",
        "event_type": "choice",
        "choices": [
          {
            "id": "diy_booth",
            "label": "DIY photo booth ($8)",
            "icon": "📸",
            "cost": 8,
            "effect": "Props and a backdrop for $8! Everyone loves taking silly photos!"
          },
          {
            "id": "skip_booth",
            "label": "Skip it — use phones instead",
            "icon": "📱",
            "cost": 0,
            "effect": "Phone cameras work great! You saved the money for other things."
          },
          {
            "id": "fundraise",
            "label": "Quick fundraiser to cover it",
            "icon": "💡",
            "cost": null,
            "effect": "You raised extra money with a quick bake sale! The booth is funded!"
          }
        ]
      },
      {
        "description": "Dance night! Everything is set up. You have some money left over. What do you do with it?",
        "event_type": "choice",
        "choices": [
          {
            "id": "save_next",
            "label": "Save it for the next school event",
            "icon": "🐷",
            "cost": null,
            "effect": "Thinking ahead! The next event already has a head start on its budget."
          },
          {
            "id": "thank_helpers",
            "label": "Buy thank-you treats for the helpers",
            "icon": "🎁",
            "cost": null,
            "effect": "What a thoughtful leader! Your team feels appreciated."
          },
          {
            "id": "last_minute",
            "label": "Add a last-minute surprise for everyone",
            "icon": "✨",
            "cost": null,
            "effect": "Glow sticks for everyone! A surprise hit at the dance!"
          }
        ]
      }
    ],
    "recap_template": "You managed a real event budget! You handled multiple categories, dealt with price changes, and made trade-offs. These are skills you'll use your whole life.",
    "positive_framing_rules": [
      "Never say the student went over budget or messed up",
      "Frame budget surprises as problem-solving opportunities",
      "Celebrate creative solutions and adaptability"
    ],
    "ai_variation_allowed": [
      "Change the event type",
      "Vary the surprise expense scenario",
      "Add different classmate suggestions"
    ],
    "max_turns": 15
  },
  {
    "id": "tier3_comparison_shopper",
    "title": "Comparison Shopper",
    "tier": 3,
    "domain": "money",
    "icon": "🛒",
    "learning_objectives": [
      "Compare prices across different options",
      "Calculate unit price for value comparison",
      "Make informed purchasing decisions"
    ],
    "initial_state": {
      "wallet": 30,
      "currency": "dollars",
      "shopping_list": [
        "backpack",
        "notebooks",
        "pens"
      ]
    },
    "events": [
      {
        "description": "Back-to-school shopping! You need a backpack, notebooks, and pens with $30. Store A has a backpack for $18, Store B has one for $22 but it's waterproof and has a warranty. What do you pick?",
        "event_type": "choice",
        "choices": [
          {
            "id": "store_a",
            "label": "Store A — $18 basic backpack",
            "icon": "🎒",
            "cost": 18,
            "effect": "Good value! $12 left for the rest of your list."
          },
          {
            "id": "store_b",
            "label": "Store B — $22 waterproof with warranty",
            "icon": "🎒💧",
            "cost": 22,
            "effect": "Might last longer and protect your stuff in rain! $8 left."
          },
          {
            "id": "online",
            "label": "Search online — $15 with free shipping (1 week wait)",
            "icon": "📦",
            "cost": 15,
            "effect": "Best price! But you'll have to wait a week. $15 left for other items."
          }
        ]
      },
      {
        "description": "Notebook time! A 3-pack costs $6, or you can buy singles for $2.50 each. You need 3 notebooks. Which is the better deal?",
        "event_type": "choice",
        "choices": [
          {
            "id": "three_pack",
            "label": "3-pack for $6 ($2.00 each)",
            "icon": "📓",
            "cost": 6,
            "effect": "The 3-pack saves you $1.50! Unit price comparison for the win!"
          },
          {
            "id": "singles",
            "label": "3 singles for $7.50 ($2.50 each)",
            "icon": "📒",
            "cost": 7,
            "effect": "You got to pick 3 different colors! Sometimes variety is worth a little more."
          },
          {
            "id": "two_pack_plus",
            "label": "2-pack ($4) + 1 fancy notebook ($4)",
            "icon": "📔",
            "cost": 8,
            "effect": "Two regular ones and one special one! A nice mix of value and quality."
          }
        ]
      },
      {
        "description": "Last item: pens! A 10-pack of basic pens is $3. A 5-pack of gel pens is $5. A single fancy pen is $4. What's the best value for you?",
        "event_type": "choice",
        "choices": [
          {
            "id": "basic_10",
            "label": "10 basic pens — $0.30 each",
            "icon": "🖊️",
            "cost": 3,
            "effect": "Best unit price! You'll have pens for months!"
          },
          {
            "id": "gel_5",
            "label": "5 gel pens — $1.00 each",
            "icon": "✒️",
            "cost": 5,
            "effect": "Gel pens are so smooth! Sometimes paying more for quality is worth it."
          },
          {
            "id": "fancy_1",
            "label": "1 fancy refillable pen — $4.00",
            "icon": "🖋️",
            "cost": 4,
            "effect": "One great pen you can refill! Costs more upfront but less over time."
          }
        ]
      },
      {
        "description": "Shopping done! Let's look at your total spending and what you got. Was there a way to get even better value?",
        "event_type": "choice",
        "choices": [
          {
            "id": "review_happy",
            "label": "I'm happy with my choices!",
            "icon": "😊",
            "cost": null,
            "effect": "You made thoughtful decisions at every step! That's what smart shopping is about."
          },
          {
            "id": "review_learn",
            "label": "I'd do some things differently next time",
            "icon": "🤔",
            "cost": null,
            "effect": "Reflecting on your choices helps you shop smarter next time! Great self-awareness."
          },
          {
            "id": "review_save",
            "label": "I saved money — let's see how much!",
            "icon": "💰",
            "cost": null,
            "effect": "Let's count it up! Every dollar saved is a dollar you can use for something else."
          }
        ]
      }
    ],
    "recap_template": "You practiced comparison shopping! You learned about unit prices, quality vs cost trade-offs, and making thoughtful purchasing decisions.",
    "positive_framing_rules": [
      "Never say the student wasted money or bought the wrong thing",
      "Frame both budget and quality choices as valid strategies",
      "Celebrate the thinking process, not just the outcome"
    ],
    "ai_variation_allowed": [
      "Change the shopping items",
      "Vary store names and prices",
      "Add coupons or sales as surprises"
    ],
    "max_turns": 15
  },
  {
    "id": "tier3_club_treasurer",
    "title": "Club Treasurer",
    "tier": 3,
    "domain": "money",
    "icon": "📊",
    "learning_objectives": [
      "Manage a shared budget across multiple events",
      "Balance different stakeholder needs",
      "Track spending and communicate about money"
    ],
    "initial_state": {
      "wallet": 500,
      "currency": "dollars",
      "club": "Science Club",
      "members": 20,
      "events_planned": 3
    },
    "events": [
      {
        "description": "You're the Science Club treasurer with $500 for the semester. The club wants 3 events: a field trip ($200), a science fair booth ($150), and an end-of-year pizza party ($100). That's $450 — but what about supplies for weekly meetings? Those cost about $10/week for 10 weeks ($100). The math doesn't add up! What's your plan?",
        "event_type": "choice",
        "choices": [
          {
            "id": "cut_trip",
            "label": "Cheaper field trip ($150) to cover supplies",
            "icon": "🚌",
            "cost": null,
            "effect": "A closer field trip saves $50! Now everything fits in the budget."
          },
          {
            "id": "fundraise",
            "label": "Fundraise $100 for supplies separately",
            "icon": "💡",
            "cost": null,
            "effect": "A candy sale raises $120! Supplies covered and $20 extra!"
          },
          {
            "id": "reduce_all",
            "label": "Trim 10% from each event budget",
            "icon": "✂️",
            "cost": null,
            "effect": "Small cuts across the board save $45! Every category still gets most of its budget."
          }
        ]
      },
      {
        "description": "The science fair is coming up. Your $150 booth budget needs to cover materials ($80), a poster ($30), and prizes ($40). A club member found cheaper materials for $50. Do you keep the savings or upgrade something?",
        "event_type": "choice",
        "choices": [
          {
            "id": "save_buffer",
            "label": "Save the $30 as a buffer",
            "icon": "🐷",
            "cost": null,
            "effect": "A $30 buffer for unexpected costs. Treasurer thinking!"
          },
          {
            "id": "better_prizes",
            "label": "Upgrade prizes to $70",
            "icon": "🏆",
            "cost": null,
            "effect": "Better prizes will attract more visitors! The booth will be a hit!"
          },
          {
            "id": "both_small",
            "label": "Better poster ($45) and save $15",
            "icon": "📊",
            "cost": null,
            "effect": "A more eye-catching poster plus a small buffer. Balanced upgrade!"
          }
        ]
      },
      {
        "description": "Two members want to spend leftover money differently. One wants extra lab supplies, the other wants matching club t-shirts ($8 each for 20 people = $160). You only have $80 left.",
        "event_type": "choice",
        "choices": [
          {
            "id": "lab_supplies",
            "label": "Lab supplies — serves the club's mission",
            "icon": "🔬",
            "cost": null,
            "effect": "Lab supplies help everyone learn! Aligned with the club's purpose."
          },
          {
            "id": "cheaper_shirts",
            "label": "Find $4 shirts instead — $80 total!",
            "icon": "👕",
            "cost": null,
            "effect": "Creative budgeting! Everyone gets a shirt at half the price!"
          },
          {
            "id": "vote",
            "label": "Put it to a club vote",
            "icon": "🗳️",
            "cost": null,
            "effect": "The club votes and the decision feels fair to everyone!"
          }
        ]
      },
      {
        "description": "End of semester! Time to present your financial report to the club advisor. How did you manage the $500?",
        "event_type": "choice",
        "choices": [
          {
            "id": "detailed_report",
            "label": "Show a detailed breakdown of all spending",
            "icon": "📋",
            "cost": null,
            "effect": "Your clear report impresses the advisor! They see exactly where every dollar went."
          },
          {
            "id": "highlight_wins",
            "label": "Highlight what you accomplished within budget",
            "icon": "🌟",
            "cost": null,
            "effect": "Three events, weekly supplies, and money saved! The advisor is proud of your work."
          },
          {
            "id": "next_semester",
            "label": "Present a plan for next semester too",
            "icon": "📅",
            "cost": null,
            "effect": "Forward thinking! The advisor loves that you're already planning ahead."
          }
        ]
      }
    ],
    "recap_template": "You managed a club budget for a whole semester! You balanced competing needs, handled surprises, and made fair decisions. Real-world treasurer skills!",
    "positive_framing_rules": [
      "Never say the student mismanaged money",
      "Frame budget constraints as creative challenges",
      "Celebrate communication and fairness in budget decisions"
    ],
    "ai_variation_allowed": [
      "Change the club type",
      "Vary the specific events and costs",
      "Add unexpected fundraising opportunities"
    ],
    "max_turns": 15
  },
  {
    "id": "tier3_savings_goal_tracker",
    "title": "Savings Goal Tracker",
    "tier": 3,
    "domain": "money",
    "icon": "🎯",
    "learning_objectives": [
      "Set and track a long-term savings goal",
      "Handle competing wants while saving",
      "Calculate progress toward a target"
    ],
    "initial_state": {
      "wallet": 0,
      "currency": "dollars",
      "goal_item": "gaming headset",
      "goal_price": 200,
      "weekly_income": 25,
      "weeks": 8
    },
    "events": [
      {
        "description": "You want a $200 gaming headset and earn $25/week from chores. If you save everything, you'd have it in 8 weeks. But life happens! Week 1: your friend invites you to the movies ($15). Do you go?",
        "event_type": "choice",
        "choices": [
          {
            "id": "skip_movie",
            "label": "Skip the movie, save $25",
            "icon": "🐷",
            "cost": 0,
            "effect": "Full $25 saved! You're 12.5% of the way there already!"
          },
          {
            "id": "go_movie",
            "label": "Go to the movie, save $10",
            "icon": "🎬",
            "cost": 15,
            "effect": "Fun movie with your friend! $10 saved this week. Experiences matter too!"
          },
          {
            "id": "cheaper_option",
            "label": "Suggest a free hangout instead",
            "icon": "🏞️",
            "cost": 0,
            "effect": "Park hangout with your friend — just as fun AND you saved $25!"
          }
        ]
      },
      {
        "description": "Week 4 check-in! You've saved some money but you're behind your $100 target. A neighbor offers you a one-time $30 job raking leaves. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "take_job",
            "label": "Take the leaf-raking job",
            "icon": "🍂",
            "cost": null,
            "effect": "Extra $30! You're back on track or even ahead!"
          },
          {
            "id": "negotiate",
            "label": "Ask if they have more jobs next week too",
            "icon": "💼",
            "cost": null,
            "effect": "They say yes! $30 this week and $20 next week. Entrepreneurial thinking!"
          },
          {
            "id": "pass",
            "label": "You're already on track, skip it",
            "icon": "😌",
            "cost": null,
            "effect": "You checked your savings and you're doing fine! No need for extra work right now."
          }
        ]
      },
      {
        "description": "Week 6! The headset just went on sale for $170 — 15% off! But the sale ends this week and you have $155. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "wait",
            "label": "Keep saving — you'll have $200 in 2 weeks",
            "icon": "⏳",
            "cost": null,
            "effect": "Patience! In 2 weeks you'll have the full $200 and money to spare."
          },
          {
            "id": "ask_advance",
            "label": "Ask parents for a $15 advance on next week's chores",
            "icon": "🤝",
            "cost": null,
            "effect": "Parents agree! You get the sale price and pay it back next week. Smart negotiating!"
          },
          {
            "id": "different_headset",
            "label": "Look for a similar headset within your budget",
            "icon": "🔍",
            "cost": null,
            "effect": "You find a great option for $150! Under budget and highly rated!"
          }
        ]
      },
      {
        "description": "Goal complete! You got your headset. Let's reflect on the journey.",
        "event_type": "choice",
        "choices": [
          {
            "id": "reflect_discipline",
            "label": "I learned that saving takes patience",
            "icon": "🧠",
            "cost": null,
            "effect": "Patience is a superpower! You proved you can work toward a big goal over time."
          },
          {
            "id": "reflect_flexible",
            "label": "I learned to be flexible with my plan",
            "icon": "🌊",
            "cost": null,
            "effect": "Adapting to changes made you a better saver! Plans can shift and that's okay."
          },
          {
            "id": "reflect_earn",
            "label": "I learned I can earn more when I need to",
            "icon": "💪",
            "cost": null,
            "effect": "Finding extra income showed real initiative! You took control of your goal."
          }
        ]
      }
    ],
    "recap_template": "You saved for a $200 goal over 8 weeks! You handled temptations, found extra income, and adapted when prices changed. Long-term saving is a powerful skill.",
    "positive_framing_rules": [
      "Never say the student spent carelessly or fell behind",
      "Frame spending on experiences as valid alongside saving",
      "Celebrate adaptability and persistence"
    ],
    "ai_variation_allowed": [
      "Change the goal item",
      "Vary the weekly temptation scenarios",
      "Add different earning opportunities"
    ],
    "max_turns": 15
  },
  {
    "id": "tier3_should_i_join",
    "title": "Should I Join?",
    "tier": 3,
    "domain": "social",
    "icon": "🤔",
    "learning_objectives": [
      "Use a decision matrix to evaluate options",
      "Weigh pros and cons of activities",
      "Make structured decisions about commitments"
    ],
    "initial_state": {
      "options": 3,
      "criteria": [
        "fun",
        "learning",
        "time_commitment",
        "social"
      ],
      "available_time": "10 hours per week"
    },
    "events": [
      {
        "description": "Three clubs are recruiting! Drama Club (3hr/week, performances, social), Coding Club (2hr/week, build projects, smaller group), and Soccer Team (5hr/week, competitive, large team). You have 10 hours/week of free time. How do you start deciding?",
        "event_type": "choice",
        "choices": [
          {
            "id": "try_all",
            "label": "Try all three for a week each",
            "icon": "🔄",
            "cost": null,
            "effect": "Hands-on research! After trying each, you have real data for your decision."
          },
          {
            "id": "decision_matrix",
            "label": "Rate each club on fun, learning, time, social",
            "icon": "📊",
            "cost": null,
            "effect": "A decision matrix! You score each option and compare. Structured thinking!"
          },
          {
            "id": "ask_friends",
            "label": "Talk to kids in each club about their experience",
            "icon": "💬",
            "cost": null,
            "effect": "First-hand accounts! Their experiences help you imagine yourself in each club."
          }
        ]
      },
      {
        "description": "You're leaning toward two clubs. Drama is super fun but 3 hours during your busiest day. Coding is flexible timing and you love building things. Can you do both?",
        "event_type": "choice",
        "choices": [
          {
            "id": "both",
            "label": "Join both — 5 hours total fits!",
            "icon": "🎭💻",
            "cost": null,
            "effect": "5 of your 10 free hours — totally doable! And the skills are so different."
          },
          {
            "id": "coding_only",
            "label": "Just coding — keep more free time",
            "icon": "💻",
            "cost": null,
            "effect": "One focused commitment leaves time for other things. Quality over quantity!"
          },
          {
            "id": "talk_to_leaders",
            "label": "Ask if Drama has a less intensive role",
            "icon": "🗣️",
            "cost": null,
            "effect": "The director says you can help with set design — only 1.5 hours! Now both fit perfectly!"
          }
        ]
      },
      {
        "description": "A month in, your best friend joins Soccer Team and wants you to switch. You're happy in your current clubs but feel pulled. How do you think through it?",
        "event_type": "choice",
        "choices": [
          {
            "id": "revisit_matrix",
            "label": "Go back to your decision criteria",
            "icon": "📊",
            "cost": null,
            "effect": "Your criteria haven't changed! Soccer doesn't score higher just because a friend joined."
          },
          {
            "id": "friend_factor",
            "label": "Add 'being with best friend' as a new factor",
            "icon": "👫",
            "cost": null,
            "effect": "Social connection is valid! You recalculate and decide based on the updated matrix."
          },
          {
            "id": "stay_course",
            "label": "Stick with your plan — see your friend other times",
            "icon": "🎯",
            "cost": null,
            "effect": "You can be friends without being in the same club! Independence is a strength."
          }
        ]
      },
      {
        "description": "End of semester reflection: how do you feel about your club decision?",
        "event_type": "choice",
        "choices": [
          {
            "id": "great_choice",
            "label": "It was the right choice for me!",
            "icon": "🌟",
            "cost": null,
            "effect": "Trusting your decision-making process paid off! You chose based on what matters to YOU."
          },
          {
            "id": "learned_something",
            "label": "I'd choose differently next time — and that's okay",
            "icon": "📝",
            "cost": null,
            "effect": "Learning what you like and don't like IS the value of trying! Great self-awareness."
          },
          {
            "id": "want_more",
            "label": "I want to try something new next semester",
            "icon": "🚀",
            "cost": null,
            "effect": "Growth mindset! You can always explore new activities. The decision skills you built carry over."
          }
        ]
      }
    ],
    "recap_template": "You used structured decision-making to choose activities! Whether you use a matrix, talk to people, or try things out, having a process leads to better choices.",
    "positive_framing_rules": [
      "Never say the student made the wrong choice of club",
      "Frame changing your mind as growth, not indecision",
      "Celebrate the decision process over the specific outcome"
    ],
    "ai_variation_allowed": [
      "Change the specific clubs or activities",
      "Vary the friend dynamics",
      "Add different decision criteria"
    ],
    "max_turns": 15
  },
  {
    "id": "tier3_group_project_planner",
    "title": "Group Project Planner",
    "tier": 3,
    "domain": "social",
    "icon": "👥",
    "learning_objectives": [
      "Assign roles based on strengths",
      "Manage workload distribution",
      "Handle team challenges constructively"
    ],
    "initial_state": {
      "team_size": 4,
      "project": "history presentation",
      "days_until_due": 10,
      "team_members": [
        "You",
        "Mia",
        "Leo",
        "Sam"
      ]
    },
    "events": [
      {
        "description": "Your team has a history presentation due in 10 days. Tasks: research (4 hours), write the script (3 hours), create slides (3 hours), and practice presenting (2 hours). Mia loves research, Leo is great at design, Sam is a good speaker. How do you divide the work?",
        "event_type": "choice",
        "choices": [
          {
            "id": "strengths",
            "label": "Play to strengths: Mia researches, Leo designs, you and Sam write + present",
            "icon": "⭐",
            "cost": null,
            "effect": "Everyone does what they're best at! The project will shine because of diverse talents."
          },
          {
            "id": "equal",
            "label": "Everyone does a bit of everything",
            "icon": "⚖️",
            "cost": null,
            "effect": "Equal exposure! Everyone learns each skill, even if it takes a bit longer."
          },
          {
            "id": "pairs",
            "label": "Work in pairs: Mia+you on content, Leo+Sam on design+presentation",
            "icon": "👫",
            "cost": null,
            "effect": "Pair work means built-in support! Nobody works alone."
          }
        ]
      },
      {
        "description": "Day 5 check-in. Mia's research is excellent and Leo's slides look great. But Sam hasn't started their part yet. How do you handle it?",
        "event_type": "choice",
        "choices": [
          {
            "id": "ask_whats_up",
            "label": "Check in — 'Hey Sam, how's it going? Need help?'",
            "icon": "💬",
            "cost": null,
            "effect": "Sam was overwhelmed by other homework. Once you understood, you adjusted the plan. Empathy + problem-solving!"
          },
          {
            "id": "redistribute",
            "label": "Split Sam's part among the team",
            "icon": "🔀",
            "cost": null,
            "effect": "Everyone takes a small piece. The work gets done and Sam catches up when they can."
          },
          {
            "id": "adjust_deadline",
            "label": "Create mini-deadlines so nothing falls behind again",
            "icon": "📅",
            "cost": null,
            "effect": "Mini check-ins every 2 days! The team stays on track without anyone feeling singled out."
          }
        ]
      },
      {
        "description": "Day 8. During practice, Mia and Leo disagree about how to present a section. Mia wants lots of facts, Leo wants more visuals. The argument is getting tense.",
        "event_type": "choice",
        "choices": [
          {
            "id": "mediate",
            "label": "Find a middle ground — facts WITH visuals",
            "icon": "🤝",
            "cost": null,
            "effect": "An infographic! Mia's facts presented in Leo's visual style. Both feel heard and it's better than either idea alone!"
          },
          {
            "id": "audience_focus",
            "label": "Ask 'What would the audience prefer?'",
            "icon": "🎯",
            "cost": null,
            "effect": "Shifting focus to the audience dissolves the personal disagreement. Data + visuals for the win!"
          },
          {
            "id": "test_both",
            "label": "Try both approaches and see which works better",
            "icon": "🔬",
            "cost": null,
            "effect": "Testing removes opinion from the equation! The team picks what actually works best."
          }
        ]
      },
      {
        "description": "Presentation day! How does the team feel?",
        "event_type": "choice",
        "choices": [
          {
            "id": "proud_team",
            "label": "Proud of what we built together",
            "icon": "🏆",
            "cost": null,
            "effect": "The presentation is a hit! Working through challenges made the team stronger."
          },
          {
            "id": "learned_collab",
            "label": "We learned as much about teamwork as history",
            "icon": "🧠",
            "cost": null,
            "effect": "Collaboration skills are just as valuable as the content! Double learning."
          },
          {
            "id": "do_again",
            "label": "We'd work together again — we figured it out!",
            "icon": "🔄",
            "cost": null,
            "effect": "The best teams aren't the ones without disagreements — they're the ones who work through them!"
          }
        ]
      }
    ],
    "recap_template": "You led a group project from planning to presentation! You assigned roles, handled workload issues, mediated disagreements, and delivered as a team.",
    "positive_framing_rules": [
      "Never label a team member as lazy or a slacker",
      "Frame disagreements as chances to find better solutions",
      "Celebrate the team process, not just the final product"
    ],
    "ai_variation_allowed": [
      "Change the project topic",
      "Vary team member personalities",
      "Add different types of team challenges"
    ],
    "max_turns": 15
  },
  {
    "id": "tier3_multi_week_goal",
    "title": "Multi-Week Goal",
    "tier": 3,
    "domain": "social",
    "icon": "🏔️",
    "learning_objectives": [
      "Set a 4-week goal with milestones",
      "Handle setbacks without giving up",
      "Adjust plans while keeping the end goal"
    ],
    "initial_state": {
      "goal": null,
      "week": 1,
      "total_weeks": 4,
      "progress": 0,
      "milestones": []
    },
    "events": [
      {
        "description": "Set a 4-week goal! What would you like to accomplish?",
        "event_type": "choice",
        "choices": [
          {
            "id": "run_mile",
            "label": "Run a mile without stopping",
            "icon": "🏃",
            "cost": null,
            "effect": "Great goal! Week 1: run/walk for 10 minutes. Week 2: run 1/2 mile. Week 3: run 3/4 mile. Week 4: the full mile!"
          },
          {
            "id": "learn_guitar",
            "label": "Learn 3 songs on guitar",
            "icon": "🎸",
            "cost": null,
            "effect": "Awesome! Week 1: learn chords. Week 2: first song. Week 3: second song. Week 4: all three!"
          },
          {
            "id": "community_project",
            "label": "Organize a neighborhood cleanup",
            "icon": "🌍",
            "cost": null,
            "effect": "Making a difference! Week 1: plan. Week 2: recruit volunteers. Week 3: get supplies. Week 4: cleanup day!"
          }
        ]
      },
      {
        "description": "End of Week 1! You hit your first milestone. But Week 2 brings a challenge: you got sick and missed 3 days. You're behind on your milestone. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "adjust_timeline",
            "label": "Push milestones back by a few days",
            "icon": "📅",
            "cost": null,
            "effect": "Flexible! A few extra days doesn't change the overall goal. Recovery first!"
          },
          {
            "id": "modify_milestone",
            "label": "Make this week's milestone smaller",
            "icon": "📏",
            "cost": null,
            "effect": "A smaller Week 2 milestone is still progress! You can catch up when you feel better."
          },
          {
            "id": "combine_weeks",
            "label": "Combine Week 2 and 3 milestones next week",
            "icon": "🔗",
            "cost": null,
            "effect": "Ambitious catch-up plan! You'll work harder next week but the end date stays the same."
          }
        ]
      },
      {
        "description": "Week 3. You're back on track! But a friend says 'Why are you even bothering with that?' It stings a little. How do you respond to yourself?",
        "event_type": "choice",
        "choices": [
          {
            "id": "internal_motivation",
            "label": "I'm doing this for ME, not for them",
            "icon": "💪",
            "cost": null,
            "effect": "Your goals don't need anyone else's approval. Internal motivation is the strongest kind!"
          },
          {
            "id": "show_progress",
            "label": "Look at how far you've come — proof it's worth it!",
            "icon": "📈",
            "cost": null,
            "effect": "3 weeks of progress speaks louder than doubt! You can see your own growth."
          },
          {
            "id": "invite_friend",
            "label": "Invite them to join — maybe they'll understand",
            "icon": "🤝",
            "cost": null,
            "effect": "Your friend tries it and says 'Okay, this is actually cool!' Sometimes people need to see it."
          }
        ]
      },
      {
        "description": "Week 4 — final week! You're so close to your goal. One last push!",
        "event_type": "choice",
        "choices": [
          {
            "id": "full_effort",
            "label": "Give it everything this week!",
            "icon": "🔥",
            "cost": null,
            "effect": "You did it! Four weeks of dedication led to an amazing accomplishment!"
          },
          {
            "id": "celebrate_journey",
            "label": "Even if I don't fully finish, I grew so much",
            "icon": "🌱",
            "cost": null,
            "effect": "The journey IS the achievement! You're so much further than where you started."
          },
          {
            "id": "set_next_goal",
            "label": "Finish strong and already plan what's next",
            "icon": "🚀",
            "cost": null,
            "effect": "Goal achieved and already looking forward! You've built a growth mindset."
          }
        ]
      }
    ],
    "recap_template": "You set a 4-week goal, created milestones, handled setbacks, and pushed through doubt! Long-term goals teach persistence, flexibility, and self-belief.",
    "positive_framing_rules": [
      "Never say the student gave up or let themselves down",
      "Frame setbacks as normal parts of any goal journey",
      "Celebrate effort and growth, not just completion"
    ],
    "ai_variation_allowed": [
      "Change the specific goal options",
      "Vary the setback scenarios",
      "Add motivating moments and small wins"
    ],
    "max_turns": 15
  },
  {
    "id": "tier3_busy_week_juggler",
    "title": "Busy Week Juggler",
    "tier": 3,
    "domain": "time",
    "icon": "🤹",
    "learning_objectives": [
      "Balance multiple commitments with conflicts",
      "Prioritize when everything feels important",
      "Practice flexible scheduling"
    ],
    "initial_state": {
      "day": "Monday",
      "commitments": [
        "homework",
        "soccer",
        "friend_hangout",
        "chores",
        "family_dinner"
      ],
      "hours_per_day": 5
    },
    "events": [
      {
        "description": "This week is packed! You have soccer practice (Tue/Thu 4-5:30 PM), a big science project due Friday, daily homework (~1 hour), chores, and your friend wants to hang out Wednesday. Soccer and the friend hangout overlap with homework time. How do you start planning?",
        "event_type": "choice",
        "choices": [
          {
            "id": "fixed_first",
            "label": "Block out fixed commitments first (soccer, school)",
            "icon": "📌",
            "cost": null,
            "effect": "Smart! Fixed commitments go in first, then you fill around them."
          },
          {
            "id": "priority_rank",
            "label": "Rank everything by importance",
            "icon": "📊",
            "cost": null,
            "effect": "Priorities clear! Science project and soccer are non-negotiable, rest is flexible."
          },
          {
            "id": "time_map",
            "label": "Map out available hours each day",
            "icon": "🗺️",
            "cost": null,
            "effect": "You see exactly how much free time you have each day. Knowledge is power!"
          }
        ]
      },
      {
        "description": "Wednesday conflict: your friend wants to hang out 4-6 PM, but you planned to work on the science project then. The project is 40% done and due Friday.",
        "event_type": "choice",
        "choices": [
          {
            "id": "friend_short",
            "label": "See friend 4-5, project 5-7",
            "icon": "⏰",
            "cost": null,
            "effect": "Shorter hangout but you still see your friend AND make progress!"
          },
          {
            "id": "reschedule_friend",
            "label": "Ask to move hangout to Saturday",
            "icon": "📅",
            "cost": null,
            "effect": "Friend totally understands! Now Wednesday is fully open for the project."
          },
          {
            "id": "work_together",
            "label": "Invite friend to work on projects together",
            "icon": "📚👫",
            "cost": null,
            "effect": "Study session! You both get work done and hang out at the same time. Win-win!"
          }
        ]
      },
      {
        "description": "Thursday surprise: soccer practice runs 30 minutes late AND you have a math worksheet due tomorrow. You had planned to do it after practice. It's now 6 PM.",
        "event_type": "choice",
        "choices": [
          {
            "id": "homework_first",
            "label": "Math worksheet first (30 min), then science project",
            "icon": "🔢",
            "cost": null,
            "effect": "Math done! Due dates first is a solid strategy."
          },
          {
            "id": "quick_dinner_then_work",
            "label": "Quick dinner, then power through both",
            "icon": "⚡",
            "cost": null,
            "effect": "Fuel up then focus! You knock out both assignments by 8 PM."
          },
          {
            "id": "morning_math",
            "label": "Do math in the morning, science project tonight",
            "icon": "🌅",
            "cost": null,
            "effect": "Morning brain is fresh for math! Science gets your evening focus."
          }
        ]
      },
      {
        "description": "It's Friday! Science project is due today. You're 90% done but need 45 more minutes. You also have a soccer game at 4 PM. Let's figure out a plan.",
        "event_type": "choice",
        "choices": [
          {
            "id": "before_school",
            "label": "Wake up 45 min early to finish",
            "icon": "⏰",
            "cost": null,
            "effect": "Early bird gets the project done! Submitted before school even starts!"
          },
          {
            "id": "lunch_time",
            "label": "Work on it during lunch",
            "icon": "🍽️",
            "cost": null,
            "effect": "A working lunch! Project finished with time to spare before the game!"
          },
          {
            "id": "after_school",
            "label": "Quick finish right after school, before soccer",
            "icon": "🏃",
            "cost": null,
            "effect": "30 minutes of focused work after school! Done and submitted!"
          }
        ]
      }
    ],
    "recap_template": "You juggled a packed week with soccer, homework, friends, and a big project! You learned to handle conflicts, adjust plans, and prioritize what matters most.",
    "positive_framing_rules": [
      "Never say the student is overwhelmed or falling behind",
      "Frame schedule conflicts as puzzles with multiple good solutions",
      "Celebrate adaptability and planning"
    ],
    "ai_variation_allowed": [
      "Change the specific activities and commitments",
      "Vary the surprise schedule changes",
      "Add positive outcomes for good planning"
    ],
    "max_turns": 15
  },
  {
    "id": "tier3_study_planner",
    "title": "Study Planner",
    "tier": 3,
    "domain": "time",
    "icon": "📖",
    "learning_objectives": [
      "Allocate study time across subjects by difficulty",
      "Use weighted prioritization for exams",
      "Balance study with rest"
    ],
    "initial_state": {
      "days_until_exams": 5,
      "subjects": {
        "math": "hard",
        "science": "medium",
        "english": "easy",
        "history": "medium"
      },
      "hours_per_day": 3
    },
    "events": [
      {
        "description": "Exams start in 5 days! You have Math (hardest — worth 30% of grade), Science (medium — 25%), English (easiest — 20%), and History (medium — 25%). You can study 3 hours per day. How do you split Day 1?",
        "event_type": "choice",
        "choices": [
          {
            "id": "hardest_heavy",
            "label": "Math 1.5hr, Science 1hr, History 30min",
            "icon": "🔢",
            "cost": null,
            "effect": "Heavy math focus! Since it's the hardest and worth the most, front-loading makes sense."
          },
          {
            "id": "even_split",
            "label": "45 minutes each subject",
            "icon": "⚖️",
            "cost": null,
            "effect": "Equal time for everyone! A balanced approach gives you a foundation in each subject."
          },
          {
            "id": "weakest_first",
            "label": "Focus on your two weakest subjects first",
            "icon": "💪",
            "cost": null,
            "effect": "Tackling weak spots early gives you time to improve where you need it most!"
          }
        ]
      },
      {
        "description": "Day 3. You've been studying hard but you're getting tired. Your friend suggests a 2-hour study break to play basketball. Your history exam is tomorrow. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "short_break",
            "label": "30-minute basketball break, then study",
            "icon": "🏀",
            "cost": null,
            "effect": "Quick exercise refreshes your brain! You come back focused and energized."
          },
          {
            "id": "study_first",
            "label": "Finish history review, then play",
            "icon": "📚",
            "cost": null,
            "effect": "History locked in! Now basketball is your reward. Well-earned!"
          },
          {
            "id": "active_review",
            "label": "Quiz each other on history WHILE playing",
            "icon": "🧠🏀",
            "cost": null,
            "effect": "Movement helps memory! You're studying without even sitting at a desk!"
          }
        ]
      },
      {
        "description": "Day 4. You realize you understand English really well already. You could skip English review and use that time for extra math. Or stick to the plan. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "reallocate",
            "label": "Skip English, double down on math",
            "icon": "🔄",
            "cost": null,
            "effect": "Strategic reallocation! Why review what you already know? More math practice pays off!"
          },
          {
            "id": "quick_review",
            "label": "15-minute English check, rest on math",
            "icon": "⚡",
            "cost": null,
            "effect": "Quick confidence check on English, then full focus on math. Thorough approach!"
          },
          {
            "id": "stick_plan",
            "label": "Stick to the original plan",
            "icon": "📋",
            "cost": null,
            "effect": "Consistency matters! Your plan was solid and you're trusting the process."
          }
        ]
      },
      {
        "description": "Final day before exams! You have 3 hours. One last study session. How do you use it?",
        "event_type": "choice",
        "choices": [
          {
            "id": "review_all",
            "label": "Quick review of all subjects (45 min each)",
            "icon": "🔄",
            "cost": null,
            "effect": "A full sweep! Everything is fresh in your mind."
          },
          {
            "id": "focus_hardest",
            "label": "Deep focus on your hardest exam tomorrow",
            "icon": "🎯",
            "cost": null,
            "effect": "Targeted prep for tomorrow's biggest challenge!"
          },
          {
            "id": "practice_tests",
            "label": "Practice test questions only",
            "icon": "✏️",
            "cost": null,
            "effect": "Active recall! Practice tests are one of the best study methods!"
          }
        ]
      }
    ],
    "recap_template": "You created a study plan for 4 exams in 5 days! You learned to prioritize by difficulty, adjust your plan as you go, and balance study with rest.",
    "positive_framing_rules": [
      "Never say the student will do poorly or is unprepared",
      "Frame study breaks as productive, not lazy",
      "Celebrate strategic thinking about time allocation"
    ],
    "ai_variation_allowed": [
      "Change the subjects and difficulty levels",
      "Vary the study break scenarios",
      "Add helpful study tips within the narrative"
    ],
    "max_turns": 15
  },
  {
    "id": "tier3_event_coordinator",
    "title": "Event Coordinator",
    "tier": 3,
    "domain": "time",
    "icon": "📋",
    "learning_objectives": [
      "Plan a multi-day event timeline",
      "Identify task dependencies",
      "Handle schedule changes and delays"
    ],
    "initial_state": {
      "event": "school talent show",
      "days_until_event": 14,
      "tasks": [
        "auditions",
        "rehearsals",
        "set_design",
        "tickets",
        "promotion"
      ],
      "volunteers": 8
    },
    "events": [
      {
        "description": "You're coordinating the school talent show in 2 weeks! Tasks: auditions (must be first, 3 days), rehearsals (need auditions done, 5 days), set design (can start anytime, 4 days), ticket sales (need acts confirmed, 5 days), and promotion (can start anytime). What happens first?",
        "event_type": "choice",
        "choices": [
          {
            "id": "parallel_start",
            "label": "Auditions + set design + promotion start together",
            "icon": "🔀",
            "cost": null,
            "effect": "Three things at once! While auditions happen, the set and posters are getting done."
          },
          {
            "id": "sequential",
            "label": "Auditions first, then everything else",
            "icon": "1️⃣",
            "cost": null,
            "effect": "Auditions locked in! Now you know exactly who's performing before planning the rest."
          },
          {
            "id": "critical_path",
            "label": "Auditions + promotion first (longest chain)",
            "icon": "🔗",
            "cost": null,
            "effect": "You identified the critical path! Auditions → rehearsals is the longest dependency chain."
          }
        ]
      },
      {
        "description": "Day 5: Auditions ran a day late because too many people signed up. Rehearsals were supposed to start today. How do you adjust?",
        "event_type": "choice",
        "choices": [
          {
            "id": "compress_rehearsal",
            "label": "Shorten rehearsals from 5 to 4 days",
            "icon": "⏩",
            "cost": null,
            "effect": "Tighter rehearsal schedule! One extra after-school session makes up for it."
          },
          {
            "id": "overlap_tasks",
            "label": "Start rehearsals while finishing auditions",
            "icon": "🔄",
            "cost": null,
            "effect": "Early acts rehearse while last auditions happen! Parallel work saves time."
          },
          {
            "id": "extend_hours",
            "label": "Add lunch rehearsals to make up time",
            "icon": "⏰",
            "cost": null,
            "effect": "Lunch rehearsals fill the gap! Volunteers bring snacks to make it fun."
          }
        ]
      },
      {
        "description": "Day 10: The art team says set design needs 2 more days — they want to add a cool backdrop. The show is in 4 days. What do you decide?",
        "event_type": "choice",
        "choices": [
          {
            "id": "simpler_set",
            "label": "Keep the simpler set — it's already great",
            "icon": "🎭",
            "cost": null,
            "effect": "The set looks wonderful as-is! Sometimes good enough on time beats perfect late."
          },
          {
            "id": "extra_help",
            "label": "Recruit 3 more volunteers to finish faster",
            "icon": "👥",
            "cost": null,
            "effect": "More hands make light work! The backdrop gets done with a day to spare!"
          },
          {
            "id": "partial_upgrade",
            "label": "Add backdrop to main stage only, skip sides",
            "icon": "🎨",
            "cost": null,
            "effect": "A smart compromise! The main stage looks amazing and it fits the timeline."
          }
        ]
      },
      {
        "description": "Show day! Everything came together. One last decision: a performer got stage fright and might not go on. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "encourage",
            "label": "Encourage them — they've practiced so hard!",
            "icon": "💪",
            "cost": null,
            "effect": "Your encouragement helps! They go on stage and do great!"
          },
          {
            "id": "backup_plan",
            "label": "Offer to go on with them for moral support",
            "icon": "🤝",
            "cost": null,
            "effect": "You stand in the wings where they can see you. They feel safe and nail it!"
          },
          {
            "id": "flexible_order",
            "label": "Move them later in the show for more prep time",
            "icon": "📋",
            "cost": null,
            "effect": "A few more minutes to breathe and watch others helps! They perform with confidence."
          }
        ]
      }
    ],
    "recap_template": "You coordinated a school talent show from start to finish! You managed timelines, handled delays, and led a team. Those are real project management skills!",
    "positive_framing_rules": [
      "Never say the event is at risk of being ruined",
      "Frame delays as normal challenges to solve creatively",
      "Celebrate leadership and teamwork"
    ],
    "ai_variation_allowed": [
      "Change the event type",
      "Vary the specific delays and challenges",
      "Add surprise positive moments"
    ],
    "max_turns": 15
  },
  {
    "id": "tier4_gap_year",
    "title": "Plan Your Gap Year",
    "tier": 4,
    "domain": "combo",
    "icon": "🌍",
    "learning_objectives": [
      "Build a travel budget with multiple currencies and costs",
      "Plan an itinerary with time zones and logistics",
      "Research nutrition and food safety in different regions",
      "Navigate cultural sensitivity and risk management"
    ],
    "initial_state": {
      "wallet": 8000,
      "currency": "dollars",
      "months": 6,
      "destinations": [],
      "skills": [
        "budgeting",
        "planning",
        "cooking",
        "communication"
      ]
    },
    "events": [
      {
        "description": "You've saved $8,000 for a 6-month gap year! Rough costs: Southeast Asia ($800-1200/month), Europe ($1500-2500/month), South America ($1000-1500/month). You can mix regions. How do you plan your route?",
        "event_type": "choice",
        "choices": [
          {
            "id": "budget_stretch",
            "label": "4 months SE Asia + 2 months S. America (~$7,200)",
            "icon": "🌏",
            "cost": null,
            "effect": "Maximum time abroad! Lower-cost regions let you travel longer. $800 buffer for emergencies."
          },
          {
            "id": "mixed_route",
            "label": "2 months each: SE Asia, S. America, Europe (~$8,000)",
            "icon": "🗺️",
            "cost": null,
            "effect": "Three continents! Tight budget but incredible diversity of experiences. Every dollar is planned."
          },
          {
            "id": "deep_dive",
            "label": "6 months in one region — deep cultural immersion",
            "icon": "🏡",
            "cost": null,
            "effect": "Deep over wide! Six months in one place means learning the language, building relationships, and truly understanding a culture."
          }
        ]
      },
      {
        "description": "Time planning: visa processing takes 2-4 weeks, flights are cheaper booked 6-8 weeks ahead, and some regions have monsoon/extreme weather seasons. Your trip starts in 3 months. What do you plan first?",
        "event_type": "choice",
        "choices": [
          {
            "id": "visa_first",
            "label": "Visa applications — longest lead time",
            "icon": "🛂",
            "cost": null,
            "effect": "Critical path thinking! Visas can take 4 weeks and have limited appointment slots. Starting here prevents costly last-minute expediting."
          },
          {
            "id": "season_check",
            "label": "Check weather seasons — adjust route timing",
            "icon": "🌧️",
            "cost": null,
            "effect": "Smart! Arriving during monsoon season means rain every day. Shifting your Thailand visit by 6 weeks changes the entire experience."
          },
          {
            "id": "flight_deals",
            "label": "Search flights now — prices go up every week",
            "icon": "✈️",
            "cost": null,
            "effect": "Price-sensitive planning! You find a multi-city ticket for $900 instead of $1,400 for separate flights. $500 saved!"
          }
        ]
      },
      {
        "description": "Health and nutrition abroad: you'll be eating street food, cooking in hostels, and navigating unfamiliar cuisines. Some regions have different food safety standards. How do you prepare?",
        "event_type": "choice",
        "choices": [
          {
            "id": "research_food",
            "label": "Research safe street food practices + get travel vaccinations",
            "icon": "💉",
            "cost": null,
            "effect": "Preparation! Eat where locals eat (high turnover = fresh food), avoid ice in tap-water regions, get Hepatitis A and typhoid vaccines. Knowledge protects you."
          },
          {
            "id": "learn_cooking",
            "label": "Learn 5 simple recipes you can make anywhere with local ingredients",
            "icon": "👨‍🍳",
            "cost": null,
            "effect": "Self-sufficiency! Rice dishes, simple stir-fries, and egg-based meals work in almost every country. Cooking in hostels saves $10-15/day."
          },
          {
            "id": "dietary_plan",
            "label": "Research local nutrition — what foods provide what you need in each region",
            "icon": "🥗",
            "cost": null,
            "effect": "Nutritional mapping! Southeast Asian food is rich in vegetables and rice, South American food emphasizes beans and corn. Each region has balanced options."
          }
        ]
      },
      {
        "description": "Cultural scenario: you're staying with a local family and they invite you to a religious ceremony. You're unfamiliar with the customs. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "ask_respectfully",
            "label": "Ask your host to explain customs and proper behavior",
            "icon": "🙏",
            "cost": null,
            "effect": "Asking shows respect, not ignorance! Your host is happy to explain. You learn about dress code, etiquette, and the ceremony's meaning."
          },
          {
            "id": "observe_first",
            "label": "Watch and follow what others do before participating",
            "icon": "👀",
            "cost": null,
            "effect": "Observational learning! You watch the respectful behaviors, match the dress code, and follow along. Your host notices your effort and appreciates it."
          },
          {
            "id": "research_ahead",
            "label": "You already researched local customs before arriving",
            "icon": "📚",
            "cost": null,
            "effect": "Proactive cultural preparation! You read about common ceremonies in this region. When the invitation came, you already knew the basics."
          }
        ]
      },
      {
        "description": "Month 4: your budget is running lower than expected. You have $2,500 for 2 remaining months. That's tight. What adjustments do you make?",
        "event_type": "choice",
        "choices": [
          {
            "id": "work_exchange",
            "label": "Find a work-exchange: 4 hours of work for free accommodation",
            "icon": "🏨",
            "cost": null,
            "effect": "Work-exchanges (hostels, farms, language teaching) eliminate your biggest expense! $2,500 for food and activities is plenty."
          },
          {
            "id": "cheaper_region",
            "label": "Switch remaining travel to the cheapest region available",
            "icon": "💰",
            "cost": null,
            "effect": "Budget pivot! Moving to a lower-cost country stretches your remaining money. $1,000/month is comfortable in many Southeast Asian countries."
          },
          {
            "id": "shorten_trip",
            "label": "Come home 2 weeks early and use saved money for re-entry costs",
            "icon": "🏠",
            "cost": null,
            "effect": "Practical! Returning early means you're not stressed about money for the last month. Plus you have transition funds for coming home."
          }
        ]
      },
      {
        "description": "You're home! Reflecting on 6 months of travel. What was the most valuable thing you gained?",
        "event_type": "choice",
        "choices": [
          {
            "id": "independence",
            "label": "I can handle anything — I navigated a foreign country alone",
            "icon": "💪",
            "cost": null,
            "effect": "Self-reliance and confidence! If you can figure out a bus system in a language you don't speak, you can handle anything back home."
          },
          {
            "id": "perspective",
            "label": "I see the world differently — my problems feel smaller now",
            "icon": "🌍",
            "cost": null,
            "effect": "Perspective is priceless! Meeting people from different backgrounds reshapes how you see your own life, opportunities, and challenges."
          },
          {
            "id": "practical_skills",
            "label": "Budgeting, cooking, planning, communicating — I level up'd everything",
            "icon": "📈",
            "cost": null,
            "effect": "Every life skill in one adventure! You budgeted across currencies, cooked with unfamiliar ingredients, planned logistics, and communicated across cultures."
          }
        ]
      }
    ],
    "recap_template": "You planned and executed a gap year! You managed an international budget, planned across time zones and seasons, navigated food and health in new regions, and practiced cultural sensitivity. That's every life skill domain combined into one unforgettable experience.",
    "positive_framing_rules": [
      "Never suggest travel is irresponsible or a waste of time",
      "Frame budget challenges as problem-solving opportunities",
      "Celebrate cultural curiosity and respect"
    ],
    "ai_variation_allowed": [
      "Change the destinations and budget",
      "Vary the cultural scenarios",
      "Add different travel challenges and opportunities"
    ],
    "max_turns": 20
  },
  {
    "id": "tier4_meal_prep_budget",
    "title": "Meal Prep on a Budget",
    "tier": 4,
    "domain": "health",
    "icon": "🍱",
    "learning_objectives": [
      "Plan weekly meals with dietary constraints and a budget",
      "Optimize nutrition per dollar",
      "Batch cook for efficiency",
      "Adapt meals to what's on sale"
    ],
    "initial_state": {
      "wallet": 50,
      "currency": "dollars",
      "meals_per_week": 21,
      "dietary_constraints": [],
      "location": "apartment kitchen"
    },
    "events": [
      {
        "description": "You have $50 for a week of meals (breakfast, lunch, dinner). That's about $2.38 per meal. The store has chicken thighs on sale ($2/lb instead of $5/lb), eggs are $3/dozen, rice is $1/lb, and seasonal vegetables are $2/lb. How do you approach your shopping list?",
        "event_type": "choice",
        "choices": [
          {
            "id": "sale_based",
            "label": "Build meals around what's on sale",
            "icon": "🏷️",
            "cost": null,
            "effect": "Smart! Buying 3 lbs of chicken ($6 instead of $15) frees up $9 for other ingredients. Sale shopping stretches your budget."
          },
          {
            "id": "batch_cook",
            "label": "Plan 3 base recipes that make 7+ servings each",
            "icon": "🍲",
            "cost": null,
            "effect": "Batch cooking! A big pot of chili, a sheet pan of chicken, and a rice-and-bean mix covers most of the week."
          },
          {
            "id": "nutrition_first",
            "label": "Ensure each day hits protein, fiber, and vitamin targets",
            "icon": "📊",
            "cost": null,
            "effect": "Nutrition-first planning! You map out daily protein (50g+), fiber (25g+), and varied vegetables before choosing recipes."
          }
        ]
      },
      {
        "description": "You've planned your meals but realize you're $8 over budget at $58. What do you cut without sacrificing nutrition?",
        "event_type": "choice",
        "choices": [
          {
            "id": "swap_protein",
            "label": "Swap 2 chicken dinners for bean-based meals (save $6)",
            "icon": "🫘",
            "cost": null,
            "effect": "Beans cost 1/3 the price of chicken with similar protein! Chili and bean tacos are delicious AND budget-friendly."
          },
          {
            "id": "frozen_veggies",
            "label": "Switch fresh veggies to frozen for 3 meals (save $4)",
            "icon": "🥦",
            "cost": null,
            "effect": "Frozen vegetables are nutritionally identical to fresh and cost 30-50% less! Flash-frozen at peak nutrition."
          },
          {
            "id": "reduce_variety",
            "label": "Repeat lunches all week instead of 5 different ones (save $5)",
            "icon": "🔄",
            "cost": null,
            "effect": "Same lunch 5 days saves prep time AND money. Batch cooking one lunch recipe is wildly efficient."
          }
        ]
      },
      {
        "description": "Meal prep Sunday! You have 3 hours to cook for the week. How do you organize your time? You're making chicken stir-fry, chili, overnight oats, and prepping salad ingredients.",
        "event_type": "choice",
        "choices": [
          {
            "id": "parallel_cooking",
            "label": "Chili simmers while you stir-fry and prep oats",
            "icon": "⏱️",
            "cost": null,
            "effect": "Parallel cooking! Chili takes 45 min hands-off time — perfect for making other dishes simultaneously. Done in 2 hours!"
          },
          {
            "id": "sequential",
            "label": "One recipe at a time, clean as you go",
            "icon": "1️⃣",
            "cost": null,
            "effect": "Organized and methodical! Takes the full 3 hours but your kitchen stays clean and nothing burns."
          },
          {
            "id": "prep_first",
            "label": "Chop ALL vegetables first, then cook everything",
            "icon": "🔪",
            "cost": null,
            "effect": "Mise en place! Pro chefs prep first. Once everything is chopped, cooking goes lightning fast."
          }
        ]
      },
      {
        "description": "Wednesday: your roommate ate some of your prepped meals. You're 3 meals short for the rest of the week with $5 left. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "pantry_raid",
            "label": "Raid the pantry — rice, beans, and eggs = 3 meals for $2",
            "icon": "🍚",
            "cost": 2,
            "effect": "Pantry staples to the rescue! Egg fried rice, bean and rice bowl, and scrambled eggs with toast. Under budget!"
          },
          {
            "id": "roommate_owes",
            "label": "Ask roommate to cover those meals or replace them",
            "icon": "🤝",
            "cost": 0,
            "effect": "Setting boundaries about shared food! Your roommate buys you replacement groceries. Communication works!"
          },
          {
            "id": "stretch_meals",
            "label": "Add rice/bread to remaining meals to make them stretch",
            "icon": "🍞",
            "cost": 1,
            "effect": "Adding cheap carbs to existing meals extends them. Not ideal nutritionally for every meal, but solves the immediate problem."
          }
        ]
      },
      {
        "description": "End of week review: How did your $50 meal plan work out? What would you change next week?",
        "event_type": "choice",
        "choices": [
          {
            "id": "more_variety",
            "label": "I need more variety — eating the same thing gets old",
            "icon": "🌈",
            "cost": null,
            "effect": "Sauce and seasoning variety! Same base ingredients with different seasonings = different meals. Thai one night, Mexican the next."
          },
          {
            "id": "more_prep",
            "label": "More prep on Sunday so weekday meals are grab-and-go",
            "icon": "📦",
            "cost": null,
            "effect": "Pre-portioned containers make busy days effortless. 30 more minutes of Sunday prep saves hours during the week."
          },
          {
            "id": "adjust_budget",
            "label": "This week was tight — I'll try $55 next week and see the difference",
            "icon": "💰",
            "cost": null,
            "effect": "An extra $5 adds 2-3 more meal options. Sometimes a small budget increase makes a big quality-of-life difference."
          }
        ]
      }
    ],
    "recap_template": "You meal-prepped for a whole week on $50! You balanced nutrition, budget, time, and dealt with surprises. These are essential skills for living independently.",
    "positive_framing_rules": [
      "Never suggest the student is eating poorly or going hungry",
      "Frame budget constraints as creative cooking challenges",
      "Use 'energy and nutrition' language, not calorie restriction"
    ],
    "ai_variation_allowed": [
      "Change the specific meals and ingredients",
      "Vary the budget amount and sale items",
      "Add dietary preference scenarios"
    ],
    "max_turns": 18
  },
  {
    "id": "tier4_diet_fitness_planner",
    "title": "Diet + Fitness Planner",
    "tier": 4,
    "domain": "health",
    "icon": "💪",
    "learning_objectives": [
      "Align nutrition with physical activity goals",
      "Understand macronutrients and their roles",
      "Plan meals that support athletic performance",
      "Balance training intensity with recovery"
    ],
    "initial_state": {
      "sport": null,
      "training_days": 5,
      "nutrition_knowledge": "intermediate",
      "goal": null
    },
    "events": [
      {
        "description": "You're training for [sport] and want to optimize your nutrition. Your coach says you need more protein for muscle recovery and complex carbs for energy. Currently you eat about 60g protein/day. Athletes your age need 80-100g. How do you increase protein?",
        "event_type": "choice",
        "choices": [
          {
            "id": "food_based",
            "label": "Add protein-rich foods: Greek yogurt, chicken, eggs, beans",
            "icon": "🍳",
            "cost": null,
            "effect": "Whole food protein! A Greek yogurt at breakfast (+15g), chicken at lunch (+25g), and you're already at 100g. No supplements needed."
          },
          {
            "id": "timing",
            "label": "Focus on protein timing — 20-30g within 30 min of training",
            "icon": "⏰",
            "cost": null,
            "effect": "Nutrient timing matters! Post-workout protein helps muscles recover faster. A protein-rich snack after practice is key."
          },
          {
            "id": "track_first",
            "label": "Track current intake for 3 days first, then adjust",
            "icon": "📊",
            "cost": null,
            "effect": "Data-driven approach! You might be eating more protein than you think. Track before you change."
          }
        ]
      },
      {
        "description": "Game day nutrition: you have a big match at 2 PM. What do you eat and when?",
        "event_type": "choice",
        "choices": [
          {
            "id": "carb_load",
            "label": "Big pasta dinner night before, banana + toast at 11 AM",
            "icon": "🍝",
            "cost": null,
            "effect": "Classic carb-loading! Complex carbs the night before fill glycogen stores. Light carbs 3 hours before game time provide quick energy."
          },
          {
            "id": "balanced_day",
            "label": "Normal meals but extra hydration starting the morning",
            "icon": "💧",
            "cost": null,
            "effect": "Hydration is often more important than food changes! Starting water early ensures you're not dehydrated at game time."
          },
          {
            "id": "light_early",
            "label": "Light breakfast, moderate lunch at 11 AM, nothing heavy after",
            "icon": "🥪",
            "cost": null,
            "effect": "Eating 3+ hours before avoids heaviness during play. A balanced lunch at 11 gives time to digest before your 2 PM game."
          }
        ]
      },
      {
        "description": "You've been training hard all week and your body feels sore and tired. Your coach says tomorrow is a rest day. What does recovery nutrition look like?",
        "event_type": "choice",
        "choices": [
          {
            "id": "anti_inflammatory",
            "label": "Foods that reduce inflammation: berries, fish, leafy greens",
            "icon": "🫐",
            "cost": null,
            "effect": "Anti-inflammatory foods support recovery! Omega-3s from fish and antioxidants from berries help your body repair."
          },
          {
            "id": "extra_sleep_hydrate",
            "label": "Extra sleep + extra water — let your body do its thing",
            "icon": "😴",
            "cost": null,
            "effect": "Rest and hydration are the #1 recovery tools! Your body repairs most during sleep."
          },
          {
            "id": "same_nutrition",
            "label": "Same nutrition as training days — your body is still working",
            "icon": "🍽️",
            "cost": null,
            "effect": "Correct insight! Muscles repair on rest days, so they still need protein and nutrients. Don't cut calories on rest days."
          }
        ]
      },
      {
        "description": "Mid-season: you're tempted to try a restrictive diet trend that a teammate says gives them 'more energy.' It cuts out entire food groups. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "research",
            "label": "Research the science — does it have evidence?",
            "icon": "🔬",
            "cost": null,
            "effect": "Critical thinking! Most trendy diets lack evidence for athletes. Peer-reviewed research > social media claims."
          },
          {
            "id": "ask_coach",
            "label": "Ask your coach or a sports nutritionist",
            "icon": "👨‍⚕️",
            "cost": null,
            "effect": "Expert advice! A nutritionist explains that restricting food groups can actually decrease performance. Variety is key."
          },
          {
            "id": "trust_plan",
            "label": "Stick with your balanced plan — it's working",
            "icon": "✅",
            "cost": null,
            "effect": "If your energy, recovery, and performance are good, why change? Consistency beats trendy diets every time."
          }
        ]
      }
    ],
    "recap_template": "You built a nutrition plan that supports your athletic training! You learned about protein timing, game-day nutrition, recovery eating, and how to evaluate diet trends with critical thinking.",
    "positive_framing_rules": [
      "Never promote restrictive eating or body image concerns",
      "Frame nutrition as fuel and recovery, not weight management",
      "Celebrate listening to your body"
    ],
    "ai_variation_allowed": [
      "Change the sport and specific nutritional needs",
      "Vary the diet trend scenario",
      "Add sport-specific nutrition tips"
    ],
    "max_turns": 18
  },
  {
    "id": "tier4_cooking_for_one",
    "title": "Cooking for One",
    "tier": 4,
    "domain": "health",
    "icon": "👨‍🍳",
    "learning_objectives": [
      "Plan meals for a single person efficiently",
      "Reduce food waste with smart shopping",
      "Build basic cooking skills from scratch",
      "Create a sustainable cooking routine"
    ],
    "initial_state": {
      "cooking_skill": "beginner",
      "kitchen_equipment": [
        "pot",
        "pan",
        "oven",
        "knife",
        "cutting_board"
      ],
      "wallet": 40,
      "currency": "dollars_per_week"
    },
    "events": [
      {
        "description": "You've just moved out and need to cook for yourself. Recipes for 1 person are rare — most make 4+ servings. How do you handle this?",
        "event_type": "choice",
        "choices": [
          {
            "id": "batch_and_freeze",
            "label": "Cook full recipes, freeze portions for later",
            "icon": "🧊",
            "cost": null,
            "effect": "Freezer meals! Cook once, eat four times. Sunday's chili becomes Monday's lunch and Wednesday's dinner."
          },
          {
            "id": "halve_recipes",
            "label": "Learn to halve recipes — smaller batches, less waste",
            "icon": "📏",
            "cost": null,
            "effect": "Recipe math! Halving means you need half of everything. Some recipes scale down better than others."
          },
          {
            "id": "component_cooking",
            "label": "Cook components (rice, protein, veggies) and mix differently",
            "icon": "🧩",
            "cost": null,
            "effect": "Versatile! Grilled chicken becomes salad topping Monday, stir-fry Tuesday, and wraps Wednesday. Same protein, three meals."
          }
        ]
      },
      {
        "description": "Food waste challenge: you bought a head of lettuce, but one person can't eat it all before it wilts. Bananas are turning brown. Half an onion is left from Tuesday's recipe. How do you reduce waste?",
        "event_type": "choice",
        "choices": [
          {
            "id": "meal_plan_around",
            "label": "Plan the next 2 days' meals around what's about to expire",
            "icon": "📋",
            "cost": null,
            "effect": "Salad tonight, banana smoothie tomorrow morning! Planning around what you have prevents waste and saves money."
          },
          {
            "id": "preservation",
            "label": "Freeze the bananas, make croutons from stale bread",
            "icon": "🧊",
            "cost": null,
            "effect": "Preservation skills! Frozen bananas make great smoothies. Brown bananas are perfect for banana bread."
          },
          {
            "id": "buy_smaller",
            "label": "Next time: buy smaller quantities even if unit price is higher",
            "icon": "📦",
            "cost": null,
            "effect": "For one person, buying less at a higher unit price can actually save money if you throw less away. Waste costs more than the price difference!"
          }
        ]
      },
      {
        "description": "You're tired after work and tempted to order delivery ($15-20) instead of cooking. This has happened 3 times this week. At $15-20/meal vs $3-5 cooking, that's $30-45 extra per week. How do you build a sustainable cooking habit?",
        "event_type": "choice",
        "choices": [
          {
            "id": "easy_recipes",
            "label": "Find 5 meals you can make in under 15 minutes",
            "icon": "⚡",
            "cost": null,
            "effect": "Speed recipes! Eggs and toast (5 min), pasta with jarred sauce (12 min), quesadillas (8 min). When cooking is fast, delivery loses its appeal."
          },
          {
            "id": "prep_ahead",
            "label": "Sunday prep: chop veggies, marinate protein, cook grains",
            "icon": "📦",
            "cost": null,
            "effect": "Weekday cooking drops to assembly! When ingredients are ready, a meal takes 10 minutes instead of 40."
          },
          {
            "id": "budget_rule",
            "label": "Allow delivery once a week, cook the rest — compromise",
            "icon": "⚖️",
            "cost": null,
            "effect": "Realistic! One delivery a week is a treat, not a habit. $15/week on delivery vs $100+ is a huge difference."
          }
        ]
      },
      {
        "description": "After a month of cooking for yourself, what have you learned?",
        "event_type": "choice",
        "choices": [
          {
            "id": "confidence",
            "label": "I can actually cook! It gets easier with practice",
            "icon": "👨‍🍳",
            "cost": null,
            "effect": "Cooking confidence! Your first month's meals were simple, but you're already trying new things. Skills compound!"
          },
          {
            "id": "savings",
            "label": "Cooking saves so much money — I can see it in my budget",
            "icon": "💰",
            "cost": null,
            "effect": "Cooking at home averages $3-5/meal vs $12-20 eating out. Over a year, that's thousands saved!"
          },
          {
            "id": "health_impact",
            "label": "I feel better physically when I control what I eat",
            "icon": "🌟",
            "cost": null,
            "effect": "Cooking your own food means knowing exactly what's in it. More vegetables, less sodium, and portions that match your needs."
          }
        ]
      }
    ],
    "recap_template": "You learned to cook for one! Batch cooking, reducing waste, building quick recipes, and creating sustainable habits are the building blocks of feeding yourself for life.",
    "positive_framing_rules": [
      "Never shame ordering delivery or eating out",
      "Frame cooking as a skill that develops over time",
      "Celebrate progress from any starting point"
    ],
    "ai_variation_allowed": [
      "Change the specific recipes and challenges",
      "Add kitchen disaster recovery scenarios",
      "Vary the budget and dietary preferences"
    ],
    "max_turns": 18
  },
  {
    "id": "tier4_first_apartment",
    "title": "First Apartment",
    "tier": 4,
    "domain": "money",
    "icon": "🏠",
    "learning_objectives": [
      "Build a real-world monthly budget",
      "Understand fixed vs variable expenses",
      "Make trade-offs between comfort and affordability",
      "Plan for unexpected costs"
    ],
    "initial_state": {
      "monthly_income": 1500,
      "currency": "dollars",
      "categories": {
        "rent": 0,
        "utilities": 0,
        "food": 0,
        "transport": 0,
        "savings": 0,
        "personal": 0
      }
    },
    "events": [
      {
        "description": "You're moving into your first apartment with $1,500/month income. Apartment A: $700/month, close to work (saves on transport). Apartment B: $550/month, farther out (bus pass needed, $75/month). Apartment C: $850/month, includes utilities. Where do you live?",
        "event_type": "choice",
        "choices": [
          {
            "id": "apt_a",
            "label": "Apartment A — $700, walk to work",
            "icon": "🏢",
            "cost": 700,
            "effect": "No transport costs! $800 left for everything else. Location saves you time and money."
          },
          {
            "id": "apt_b",
            "label": "Apartment B — $550 + $75 bus = $625 total",
            "icon": "🚌",
            "cost": 625,
            "effect": "Cheapest housing+transport combo! $875 left. The commute is longer but the savings are real."
          },
          {
            "id": "apt_c",
            "label": "Apartment C — $850, utilities included",
            "icon": "🏠",
            "cost": 850,
            "effect": "No surprise utility bills! Predictable costs. $650 left for food, savings, and personal."
          }
        ]
      },
      {
        "description": "Groceries and food. Cooking at home costs about $200/month. Eating out averages $400/month. A mix is around $300/month. How do you plan your food budget?",
        "event_type": "choice",
        "choices": [
          {
            "id": "cook_mostly",
            "label": "Mostly cook — $200/month + $50 occasional dining",
            "icon": "👨‍🍳",
            "cost": 250,
            "effect": "$250 on food. Takes time but saves the most money. Meal prep Sundays help!"
          },
          {
            "id": "balanced_food",
            "label": "Cook weekdays, eat out weekends — $300/month",
            "icon": "🍽️",
            "cost": 300,
            "effect": "A balanced approach! Home cooking for savings, dining out for socializing."
          },
          {
            "id": "convenience",
            "label": "Mostly prepared meals and takeout — $400/month",
            "icon": "🥡",
            "cost": 400,
            "effect": "Saves time but costs more. If your schedule is packed, convenience has value too."
          }
        ]
      },
      {
        "description": "You need to set a savings target. Financial advisors suggest saving at least 10-20% of income. That's $150-$300/month from your $1,500. But you also want spending money for fun. How much do you save?",
        "event_type": "choice",
        "choices": [
          {
            "id": "save_20",
            "label": "20% — $300/month into savings",
            "icon": "🏦",
            "cost": 300,
            "effect": "Aggressive saving! In 6 months you'll have an $1,800 emergency fund. That's financial security."
          },
          {
            "id": "save_10",
            "label": "10% — $150/month, more flexibility",
            "icon": "💰",
            "cost": 150,
            "effect": "Steady saving with room for fun! $900 emergency fund in 6 months. Balanced approach."
          },
          {
            "id": "save_15",
            "label": "15% — $225/month, middle ground",
            "icon": "⚖️",
            "cost": 225,
            "effect": "Right in the sweet spot! $1,350 saved in 6 months. Solid financial foundation."
          }
        ]
      },
      {
        "description": "Month 2 surprise: your car needs a $400 repair (or bus pass goes up $25/month permanently). How do you handle it?",
        "event_type": "choice",
        "choices": [
          {
            "id": "emergency_fund",
            "label": "Use your savings — this is what it's for",
            "icon": "🏦",
            "cost": null,
            "effect": "Emergency fund to the rescue! This is exactly why saving matters. Rebuild it over the next few months."
          },
          {
            "id": "payment_plan",
            "label": "Ask the mechanic for a 3-month payment plan",
            "icon": "📋",
            "cost": null,
            "effect": "$133/month for 3 months. Spreads the cost but reduces your flexibility short-term."
          },
          {
            "id": "cut_expenses",
            "label": "Cut personal spending this month to cover it",
            "icon": "✂️",
            "cost": null,
            "effect": "A tight month but you handled it without touching savings! Discipline pays off."
          }
        ]
      },
      {
        "description": "End of Month 3. Let's review your budget. Are you spending less than you earn? Do you have savings growing? What would you adjust?",
        "event_type": "choice",
        "choices": [
          {
            "id": "on_track",
            "label": "I'm on track — small tweaks only",
            "icon": "✅",
            "cost": null,
            "effect": "Three months of budgeting practice! You've built a sustainable system. Minor adjustments keep it working."
          },
          {
            "id": "need_income",
            "label": "I need more income — look for a side gig",
            "icon": "💼",
            "cost": null,
            "effect": "Recognizing the income side of the equation! A weekend gig could add $200-400/month."
          },
          {
            "id": "restructure",
            "label": "Major restructure — move or change habits",
            "icon": "🔄",
            "cost": null,
            "effect": "Big changes sometimes make the biggest impact. A cheaper apartment or meal prep could save hundreds."
          }
        ]
      }
    ],
    "recap_template": "You built a real-world monthly budget from scratch! You balanced rent, food, transport, savings, and surprises. Budgeting isn't about restriction — it's about making your money work for your goals.",
    "positive_framing_rules": [
      "Never say the student is struggling financially",
      "Frame budget constraints as decisions, not deprivation",
      "Celebrate awareness and adjustment, not just saving"
    ],
    "ai_variation_allowed": [
      "Change the city and cost of living",
      "Vary the surprise expenses",
      "Add income opportunities"
    ],
    "max_turns": 18
  },
  {
    "id": "tier4_summer_savings_interest",
    "title": "Summer Savings + Interest",
    "tier": 4,
    "domain": "money",
    "icon": "📈",
    "learning_objectives": [
      "Understand compound interest",
      "Calculate growth over time",
      "Compare saving strategies",
      "Project future value of current decisions"
    ],
    "initial_state": {
      "income": 400,
      "currency": "dollars_per_week",
      "weeks": 12,
      "savings_account_rate": 5,
      "total_saved": 0
    },
    "events": [
      {
        "description": "Summer job! You earn $400/week for 12 weeks ($4,800 total). You found a savings account offering 5% annual interest, compounded monthly. If you save $200/week, after 3 months you'd have about $2,430 (the extra $30 is interest). How much do you save weekly?",
        "event_type": "choice",
        "choices": [
          {
            "id": "save_half",
            "label": "Save $200/week (50%) — project: ~$2,430 in 3 months",
            "icon": "💰",
            "cost": null,
            "effect": "Half saved! At 5% APR compounded monthly, $2,400 grows to about $2,430 in 3 months. Interest starts small but builds!"
          },
          {
            "id": "save_75",
            "label": "Save $300/week (75%) — project: ~$3,645 in 3 months",
            "icon": "📈",
            "cost": null,
            "effect": "Aggressive saving! $3,600 total deposits. With compound interest, you'll have about $3,645. Every dollar earns more dollars!"
          },
          {
            "id": "save_25",
            "label": "Save $100/week (25%) — project: ~$1,215 in 3 months",
            "icon": "⚖️",
            "cost": null,
            "effect": "Steady saving with plenty of spending money! $1,200 grows to about $1,215. A balanced approach."
          }
        ]
      },
      {
        "description": "Week 4: Your friend says 'Why bother with 5% interest? It's only like $30 over the summer.' Are they right? Let's think long-term. If you kept that $2,400 in the account for 5 years at 5% compounded monthly, it would grow to about $3,080.",
        "event_type": "choice",
        "choices": [
          {
            "id": "long_view",
            "label": "That's $680 in free money over 5 years! Keep saving!",
            "icon": "🔭",
            "cost": null,
            "effect": "Long-term thinking! $680 from interest alone — money making money. And if you keep adding..."
          },
          {
            "id": "compare_rates",
            "label": "What if I found a higher interest rate?",
            "icon": "🔍",
            "cost": null,
            "effect": "Great question! At 7%, that same $2,400 grows to ~$3,400 in 5 years. Rate shopping matters!"
          },
          {
            "id": "invest_instead",
            "label": "What about investing in stocks instead?",
            "icon": "📊",
            "cost": null,
            "effect": "Stocks historically return ~10% long-term but with more risk. $2,400 could become ~$3,865 in 5 years — but could also drop temporarily."
          }
        ]
      },
      {
        "description": "Week 8: A concert you've been dreaming about costs $150. You've saved $1,600 so far. If you skip the concert, that $150 saved at 5% for 10 years becomes about $247. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "skip_concert",
            "label": "Skip it — $247 future value is worth it",
            "icon": "📈",
            "cost": null,
            "effect": "Delayed gratification! That $150 works for you over the next decade."
          },
          {
            "id": "go_concert",
            "label": "Go — some experiences are priceless",
            "icon": "🎵",
            "cost": 150,
            "effect": "Memories matter too! Financial planning should leave room for things you love."
          },
          {
            "id": "compromise",
            "label": "Find cheaper tickets or split with a friend",
            "icon": "🤝",
            "cost": 75,
            "effect": "Creative! $75 for the experience, $75 stays invested. Best of both worlds."
          }
        ]
      },
      {
        "description": "End of summer! Let's project forward. If you save $2,400 each summer for 4 years (college summers) at 5% compounded monthly, what would you have at graduation?",
        "event_type": "choice",
        "choices": [
          {
            "id": "calculate",
            "label": "Let me figure this out — about $10,400!",
            "icon": "🧮",
            "cost": null,
            "effect": "Close! With compound interest on rolling deposits, you'd have about $10,500. Four summers of discipline = a real financial cushion!"
          },
          {
            "id": "automate",
            "label": "I'd set up automatic transfers so I never miss",
            "icon": "🔄",
            "cost": null,
            "effect": "Automation removes willpower from the equation! 'Pay yourself first' is the #1 savings strategy."
          },
          {
            "id": "increase_savings",
            "label": "I'd try to save more each summer as I earn more",
            "icon": "📈",
            "cost": null,
            "effect": "Increasing contributions accelerates compound growth! If you add 10% more each year, you'd have over $11,500!"
          }
        ]
      }
    ],
    "recap_template": "You learned how compound interest turns small savings into real wealth over time! The key insight: time in the market matters more than timing the market. Start early, stay consistent.",
    "positive_framing_rules": [
      "Never shame spending on experiences or fun",
      "Frame saving as empowering, not restrictive",
      "Present investing concepts without promoting risk-taking"
    ],
    "ai_variation_allowed": [
      "Change the job type and income",
      "Vary the interest rates and scenarios",
      "Add real-world financial product comparisons"
    ],
    "max_turns": 18
  },
  {
    "id": "tier4_side_hustle_sim",
    "title": "Side Hustle Simulator",
    "tier": 4,
    "domain": "money",
    "icon": "💼",
    "learning_objectives": [
      "Calculate startup costs vs revenue",
      "Understand profit margins",
      "Make investment decisions for business growth",
      "Manage cash flow over time"
    ],
    "initial_state": {
      "wallet": 200,
      "currency": "dollars",
      "business": null,
      "monthly_revenue": 0,
      "monthly_expenses": 0
    },
    "events": [
      {
        "description": "You have $200 to start a side hustle. Option A: Lawn mowing — mower costs $150, charge $25/lawn, gas costs $3/lawn. Option B: Tutoring — $0 startup, charge $20/hour, 5 hours/week available. Option C: Custom stickers — printer ink $50, sticker paper $30, sell for $3 each. Which do you start?",
        "event_type": "choice",
        "choices": [
          {
            "id": "lawn_mowing",
            "label": "Lawn mowing — $22 profit per lawn",
            "icon": "🌿",
            "cost": 150,
            "effect": "Mower bought! $50 left. You need 7 lawns to break even on the mower. After that, it's $22 profit per lawn!"
          },
          {
            "id": "tutoring",
            "label": "Tutoring — $0 startup, immediate profit",
            "icon": "📚",
            "cost": 0,
            "effect": "Pure profit from day one! $100/week potential. No equipment risk, but limited to your available hours."
          },
          {
            "id": "stickers",
            "label": "Custom stickers — $80 startup, scalable",
            "icon": "🎨",
            "cost": 80,
            "effect": "$80 invested, $120 left. Each sticker costs about $0.50 to make and sells for $3. That's a 500% markup!"
          }
        ]
      },
      {
        "description": "Month 1 results are in! You've been working hard. Now you have a choice: reinvest profits to grow, or pocket the earnings. Growing means spending money to make more money.",
        "event_type": "choice",
        "choices": [
          {
            "id": "reinvest_50",
            "label": "Reinvest 50% of profits",
            "icon": "🔄",
            "cost": null,
            "effect": "Half back into the business! Better equipment/marketing means more customers next month."
          },
          {
            "id": "reinvest_all",
            "label": "Reinvest everything — grow fast",
            "icon": "🚀",
            "cost": null,
            "effect": "All-in on growth! No pocket money this month but next month's revenue could double."
          },
          {
            "id": "pocket_all",
            "label": "Keep all profits — business stays the same size",
            "icon": "💰",
            "cost": null,
            "effect": "Money in your pocket! The business stays at current capacity. Sustainable and steady."
          }
        ]
      },
      {
        "description": "Month 3: A competitor appears, offering the same service for 20% less. Your customers are asking about it. What's your strategy?",
        "event_type": "choice",
        "choices": [
          {
            "id": "lower_prices",
            "label": "Match their prices to keep customers",
            "icon": "💲",
            "cost": null,
            "effect": "Price matching keeps customers but cuts your margin. Volume becomes more important."
          },
          {
            "id": "add_value",
            "label": "Keep prices but add extra value (better quality, faster service)",
            "icon": "⭐",
            "cost": null,
            "effect": "Premium positioning! Some customers leave, but loyal ones stay for the quality. Higher margin, fewer customers."
          },
          {
            "id": "niche_down",
            "label": "Specialize — find a niche they don't serve",
            "icon": "🎯",
            "cost": null,
            "effect": "Smart differentiation! You found an underserved market. Less competition, loyal customers."
          }
        ]
      },
      {
        "description": "Month 6 review: you've earned consistently. A friend wants to partner and split the work AND profits 50/50. They'd bring $300 in equipment. Is the partnership worth it?",
        "event_type": "choice",
        "choices": [
          {
            "id": "partner_up",
            "label": "Partner — double capacity, shared profits",
            "icon": "🤝",
            "cost": null,
            "effect": "With two people, you can take on twice as much work. Revenue could grow faster than the 50% split costs."
          },
          {
            "id": "hire_instead",
            "label": "Hire them at $15/hour instead — keep ownership",
            "icon": "📋",
            "cost": null,
            "effect": "You keep control and most of the profit. They earn a wage. Clear boundaries!"
          },
          {
            "id": "stay_solo",
            "label": "Stay solo — you've got a good thing going",
            "icon": "🧑",
            "cost": null,
            "effect": "Independence! Your business, your rules, your profits. Growth will be slower but it's all yours."
          }
        ]
      },
      {
        "description": "Year-end projection! Based on your choices, let's calculate your total profit and hourly rate. Was the hustle worth it compared to a regular part-time job at $15/hour?",
        "event_type": "choice",
        "choices": [
          {
            "id": "worth_it",
            "label": "My effective hourly rate is higher — worth it!",
            "icon": "📈",
            "cost": null,
            "effect": "Entrepreneurship paid more per hour! Plus you gained business skills no job could teach."
          },
          {
            "id": "mixed",
            "label": "About the same money, but I learned a lot more",
            "icon": "🧠",
            "cost": null,
            "effect": "The skills — pricing, marketing, customer service, cash flow — are worth more than the extra dollars."
          },
          {
            "id": "pivot",
            "label": "I'd try a different hustle next time with what I learned",
            "icon": "🔄",
            "cost": null,
            "effect": "Iteration! Every entrepreneur's second business is better than their first. You've got the playbook now."
          }
        ]
      }
    ],
    "recap_template": "You ran a side hustle for 6 months! You learned about startup costs, profit margins, competition, and growth decisions. Entrepreneurship is about solving problems and creating value.",
    "positive_framing_rules": [
      "Never say the business is failing",
      "Frame competition as a healthy part of business",
      "Celebrate learning from all outcomes, not just profit"
    ],
    "ai_variation_allowed": [
      "Change the business type options",
      "Vary the competitive scenarios",
      "Add seasonal demand changes"
    ],
    "max_turns": 18
  },
  {
    "id": "tier4_college_cost_planner",
    "title": "College Cost Planner",
    "tier": 4,
    "domain": "money",
    "icon": "🎓",
    "learning_objectives": [
      "Compare total cost of education options",
      "Understand loans, interest, and scholarships",
      "Calculate projected ROI of different paths",
      "Make long-term financial planning decisions"
    ],
    "initial_state": {
      "savings": 5000,
      "currency": "dollars",
      "options": 3,
      "years": 4
    },
    "events": [
      {
        "description": "College planning! Option A: State university — $12,000/year (after aid). Option B: Community college 2 years ($4,000/year) then transfer to state ($12,000/year x 2). Option C: Private university — $30,000/year (but $15,000 scholarship, so $15,000/year). Total costs: A=$48,000, B=$32,000, C=$60,000. You have $5,000 saved. What's your plan?",
        "event_type": "choice",
        "choices": [
          {
            "id": "state_uni",
            "label": "State university — $48,000 over 4 years",
            "icon": "🏫",
            "cost": null,
            "effect": "Full campus experience! $48,000 total. After $5,000 savings, you need $43,000 in loans/work/aid."
          },
          {
            "id": "cc_transfer",
            "label": "Community college + transfer — $32,000 total",
            "icon": "📚",
            "cost": null,
            "effect": "Smartest financial move! Same degree, $16,000 less than Option A. After savings, $27,000 needed."
          },
          {
            "id": "private",
            "label": "Private university — $60,000 (with scholarship)",
            "icon": "🏛️",
            "cost": null,
            "effect": "Premium education, premium cost. The scholarship helps but $55,000 is still a lot. What's the career earning potential?"
          }
        ]
      },
      {
        "description": "Loan time. Federal student loans charge about 5% interest. If you borrow $40,000, the standard 10-year repayment means ~$424/month ($50,880 total — you pay $10,880 in interest). How do you minimize borrowing?",
        "event_type": "choice",
        "choices": [
          {
            "id": "work_study",
            "label": "Work part-time during school — earn $5,000/year",
            "icon": "💼",
            "cost": null,
            "effect": "$20,000 less in loans! Total borrowing drops to $20,000. Monthly payment becomes ~$212. Much more manageable!"
          },
          {
            "id": "scholarship_hunt",
            "label": "Apply for 10 scholarships — average $2,000 each if you win 3",
            "icon": "📝",
            "cost": null,
            "effect": "Scholarship effort pays off! $6,000 in scholarships reduces loans by 15%. Every application is worth the time."
          },
          {
            "id": "summer_work",
            "label": "Work summers and save aggressively",
            "icon": "☀️",
            "cost": null,
            "effect": "3 summers x $4,000 saved = $12,000 less borrowing. Combined with your initial $5,000, that's significant!"
          }
        ]
      },
      {
        "description": "Let's talk ROI. The average state university graduate earns $55,000/year starting salary. Community college transfer grads earn the same (same degree!). Private university grads average $62,000 starting. Over 10 years, which path has the best return?",
        "event_type": "choice",
        "choices": [
          {
            "id": "cc_best_roi",
            "label": "CC transfer — lowest cost, same salary as state = best ROI",
            "icon": "📊",
            "cost": null,
            "effect": "Correct! Same $55k salary but $16k less in costs. The ROI math strongly favors this path."
          },
          {
            "id": "private_higher",
            "label": "Private — $7,000/year more salary might offset the higher cost",
            "icon": "🧮",
            "cost": null,
            "effect": "Over 10 years, $70,000 extra earnings vs $28,000 extra cost. Net benefit of $42,000! But only if you get that salary."
          },
          {
            "id": "depends",
            "label": "It depends on my field — some careers need specific schools",
            "icon": "🤔",
            "cost": null,
            "effect": "Nuanced thinking! In some fields, school prestige matters more. In others, the degree itself is what counts. Research your specific career path."
          }
        ]
      },
      {
        "description": "Final question: you got into your top choice AND received unexpected financial aid reducing costs by $8,000/year. But your second choice offers a full-ride scholarship (free tuition). What do you choose?",
        "event_type": "choice",
        "choices": [
          {
            "id": "top_choice",
            "label": "Top choice with partial aid — follow your dream",
            "icon": "🌟",
            "cost": null,
            "effect": "Your dream school, more affordable now! The reduced cost makes the loan burden manageable."
          },
          {
            "id": "full_ride",
            "label": "Full ride — graduate debt-free",
            "icon": "🎓",
            "cost": null,
            "effect": "Zero debt at graduation! That financial freedom means more choices after college. Grad school, travel, or save immediately."
          },
          {
            "id": "negotiate",
            "label": "Use the full-ride offer to negotiate with top choice",
            "icon": "🤝",
            "cost": null,
            "effect": "Smart! Many schools will match or improve offers. Your top choice increases aid by $3,000/year."
          }
        ]
      }
    ],
    "recap_template": "You planned for college costs using loans, scholarships, work, and ROI analysis! Education is an investment — understanding the math helps you make the best choice for your future.",
    "positive_framing_rules": [
      "Never say a school choice is wrong or too expensive",
      "Frame loans as tools, not traps",
      "Celebrate all educational paths equally"
    ],
    "ai_variation_allowed": [
      "Change the school types and costs",
      "Vary scholarship amounts",
      "Add different career salary projections"
    ],
    "max_turns": 18
  },
  {
    "id": "tier4_conflict_resolver",
    "title": "Conflict Resolver",
    "tier": 4,
    "domain": "social",
    "icon": "🕊️",
    "learning_objectives": [
      "See situations from multiple perspectives",
      "Practice de-escalation techniques",
      "Find solutions that address root causes",
      "Communicate assertively but respectfully"
    ],
    "initial_state": {
      "setting": "school/workplace",
      "parties_involved": 3,
      "conflict_level": "moderate"
    },
    "events": [
      {
        "description": "Scenario: You and a classmate were paired on a project. You did 80% of the work, they did 20%. Now they want equal credit. You're frustrated. Before you react, consider their perspective — they mentioned their parent was sick last week. How do you approach this?",
        "event_type": "choice",
        "choices": [
          {
            "id": "empathy_first",
            "label": "Start by acknowledging their situation, then discuss the work gap",
            "icon": "❤️",
            "cost": null,
            "effect": "Leading with empathy opens the conversation. They explain they were at the hospital most nights. Now you can solve the real problem together."
          },
          {
            "id": "facts_first",
            "label": "Present the work split factually — 'I noticed I did sections 1-4, you did part of 5'",
            "icon": "📊",
            "cost": null,
            "effect": "Factual framing avoids blame. 'I noticed' is different from 'you didn't.' They agree and offer to do extra for the next phase."
          },
          {
            "id": "teacher_mediate",
            "label": "Ask the teacher to mediate before it becomes an argument",
            "icon": "👩‍🏫",
            "cost": null,
            "effect": "Third-party mediation! The teacher helps you both share perspectives without it getting personal."
          }
        ]
      },
      {
        "description": "The conversation gets emotional. Your classmate says 'You don't understand what I've been going through!' You feel your own frustration rising. What do you do in this moment?",
        "event_type": "choice",
        "choices": [
          {
            "id": "pause",
            "label": "Pause — 'You're right, I don't fully understand. Can you tell me?'",
            "icon": "⏸️",
            "cost": null,
            "effect": "De-escalation through validation! When someone feels heard, the emotional temperature drops. They open up about their situation."
          },
          {
            "id": "i_statements",
            "label": "Use I-statements: 'I feel frustrated because I put in a lot of work'",
            "icon": "🗣️",
            "cost": null,
            "effect": "I-statements express your feelings without attacking. 'I feel frustrated' is different from 'You're lazy.' Both feelings are now on the table."
          },
          {
            "id": "break",
            "label": "Suggest a 10-minute break before continuing",
            "icon": "☕",
            "cost": null,
            "effect": "Emotional regulation! Neither of you will solve this well when emotions are high. A break lets both brains switch from reactive to thoughtful."
          }
        ]
      },
      {
        "description": "You've both calmed down. Now you need a solution. The project is due in 5 days. How do you move forward?",
        "event_type": "choice",
        "choices": [
          {
            "id": "redistribute",
            "label": "Redistribute remaining work so they can catch up on their share",
            "icon": "📋",
            "cost": null,
            "effect": "A forward-looking solution! They take on the presentation prep and bibliography — doable in their situation and adds real value."
          },
          {
            "id": "differentiated_credit",
            "label": "Suggest noting each person's contributions on the project",
            "icon": "📝",
            "cost": null,
            "effect": "Transparent credit! You both get credit for the project but each section shows who contributed what. Fair and honest."
          },
          {
            "id": "grace_and_plan",
            "label": "Give grace this time, but set clear expectations for Part 2",
            "icon": "🤝",
            "cost": null,
            "effect": "Sometimes people need grace during hard times. You set up a shared task tracker for Part 2 so expectations are crystal clear."
          }
        ]
      },
      {
        "description": "Reflecting on this conflict: what's the biggest lesson?",
        "event_type": "choice",
        "choices": [
          {
            "id": "both_valid",
            "label": "Both people's feelings were valid — the conflict was the situation, not the people",
            "icon": "💡",
            "cost": null,
            "effect": "Key insight! Most conflicts are situational, not personal. Separating the person from the problem is the foundation of conflict resolution."
          },
          {
            "id": "early_communication",
            "label": "If we'd talked earlier, it wouldn't have built up",
            "icon": "📢",
            "cost": null,
            "effect": "Prevention! A quick check-in in Week 1 ('How are you doing on your sections?') catches problems before they become conflicts."
          },
          {
            "id": "multiple_solutions",
            "label": "There were many possible solutions — not just 'I win, you lose'",
            "icon": "🔀",
            "cost": null,
            "effect": "Win-win thinking! The best solutions address both people's needs. That's not compromise — it's creative problem-solving."
          }
        ]
      }
    ],
    "recap_template": "You resolved a real-world conflict using empathy, assertive communication, and creative problem-solving! Conflict resolution isn't about winning — it's about finding solutions that work for everyone.",
    "positive_framing_rules": [
      "Never frame either party as the villain",
      "Model de-escalation in all response options",
      "Celebrate emotional regulation as a skill"
    ],
    "ai_variation_allowed": [
      "Change the conflict scenario",
      "Vary the emotional dynamics",
      "Add different resolution approaches"
    ],
    "max_turns": 18
  },
  {
    "id": "tier4_job_interview_prep",
    "title": "Job Interview Prep",
    "tier": 4,
    "domain": "social",
    "icon": "👔",
    "learning_objectives": [
      "Practice answering common interview questions",
      "Present skills and experiences confidently",
      "Handle unexpected questions gracefully",
      "Follow up professionally"
    ],
    "initial_state": {
      "job": "part-time position",
      "interview_stage": "preparation",
      "confidence": 50
    },
    "events": [
      {
        "description": "You have a job interview tomorrow for a part-time position. The interviewer will likely ask: 'Tell me about yourself,' 'Why do you want this job?' and 'What's your biggest strength?' How do you prepare?",
        "event_type": "choice",
        "choices": [
          {
            "id": "practice_answers",
            "label": "Write out key points for each question and practice aloud",
            "icon": "📝",
            "cost": null,
            "effect": "Preparation builds confidence! You have clear, concise answers ready. Practice out loud makes them feel natural, not scripted."
          },
          {
            "id": "research_company",
            "label": "Research the company so you can connect your answers to their values",
            "icon": "🔍",
            "cost": null,
            "effect": "Impressive! Mentioning specific company details shows genuine interest. 'I saw your community volunteer program and that aligns with my values.'"
          },
          {
            "id": "mock_interview",
            "label": "Do a mock interview with a friend or family member",
            "icon": "🎭",
            "cost": null,
            "effect": "Real practice! Your friend asks tough questions and gives honest feedback. You discover you say 'um' too much and fix it."
          }
        ]
      },
      {
        "description": "Interview day! First question: 'Tell me about a time you had to handle a difficult situation.' You're nervous and your mind goes blank for a moment. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "pause_think",
            "label": "Take a breath and say 'Great question, let me think for a moment'",
            "icon": "💭",
            "cost": null,
            "effect": "Totally professional! Pausing to think shows confidence, not weakness. Your answer is better because you took a moment."
          },
          {
            "id": "star_method",
            "label": "Use the STAR method: Situation, Task, Action, Result",
            "icon": "⭐",
            "cost": null,
            "effect": "Structured storytelling! 'At my volunteer job (Situation), we needed to reorganize (Task), I created a schedule (Action), and we finished early (Result).' Clear and impressive!"
          },
          {
            "id": "honest",
            "label": "Be honest: 'I'm a bit nervous but I'm excited about this opportunity'",
            "icon": "😊",
            "cost": null,
            "effect": "Authenticity! The interviewer smiles — they appreciate honesty. It actually relaxes the conversation and you answer naturally."
          }
        ]
      },
      {
        "description": "Curveball question: 'If you could have any superpower, what would it be and why?' This isn't about the answer — it's about how you think on your feet.",
        "event_type": "choice",
        "choices": [
          {
            "id": "creative",
            "label": "Connect it to the job: 'Time control — I'd never miss a deadline!'",
            "icon": "⏰",
            "cost": null,
            "effect": "Clever tie-in! You showed creativity and job relevance in one answer. The interviewer laughs and nods."
          },
          {
            "id": "thoughtful",
            "label": "Be genuine: 'Teleportation — I value experiences and seeing the world'",
            "icon": "🌍",
            "cost": null,
            "effect": "Authentic answer that reveals your values! The interviewer sees you as thoughtful and genuine. There's no wrong answer here."
          },
          {
            "id": "humor",
            "label": "Light humor: 'Mind reading — but only during interviews!'",
            "icon": "😄",
            "cost": null,
            "effect": "Humor that acknowledges the situation! The interviewer laughs. A moment of levity makes the interview feel more like a conversation."
          }
        ]
      },
      {
        "description": "Interview is over! The interviewer asks 'Do you have any questions for us?' This is your chance to show interest and gather information.",
        "event_type": "choice",
        "choices": [
          {
            "id": "growth_question",
            "label": "'What does growth look like in this role?'",
            "icon": "📈",
            "cost": null,
            "effect": "Shows ambition and long-term thinking! The interviewer appreciates someone who thinks beyond just getting hired."
          },
          {
            "id": "culture_question",
            "label": "'What do you enjoy most about working here?'",
            "icon": "💬",
            "cost": null,
            "effect": "Flips the interview! Now THEY'RE sharing, and you get genuine insight into the workplace culture."
          },
          {
            "id": "next_steps",
            "label": "'What are the next steps in the hiring process?'",
            "icon": "📋",
            "cost": null,
            "effect": "Practical and confident! You know exactly what to expect next and when to follow up."
          }
        ]
      },
      {
        "description": "After the interview: follow-up. You should send a thank-you note within 24 hours. What do you write?",
        "event_type": "choice",
        "choices": [
          {
            "id": "specific_thanks",
            "label": "Reference a specific conversation point from the interview",
            "icon": "📧",
            "cost": null,
            "effect": "Personalized! 'I especially enjoyed hearing about your volunteer program' shows you were listening and engaged."
          },
          {
            "id": "reiterate_fit",
            "label": "Briefly restate why you're a great fit for the role",
            "icon": "✨",
            "cost": null,
            "effect": "Reinforcement! One more reminder of your strengths keeps you top-of-mind during their decision."
          },
          {
            "id": "short_sweet",
            "label": "Keep it brief: thank them, express enthusiasm, sign off",
            "icon": "✉️",
            "cost": null,
            "effect": "Concise professionalism! Busy hiring managers appreciate brevity. Two sentences and a polite close."
          }
        ]
      }
    ],
    "recap_template": "You prepared for, aced, and followed up on a job interview! You practiced common questions, handled curveballs, asked smart questions, and sent a professional follow-up. These skills apply to every interview in your future.",
    "positive_framing_rules": [
      "Never say the student bombed or failed a question",
      "Frame nervousness as normal and manageable",
      "Celebrate preparation and professionalism"
    ],
    "ai_variation_allowed": [
      "Change the job type",
      "Vary the interview questions",
      "Add different interviewer personalities"
    ],
    "max_turns": 18
  },
  {
    "id": "tier4_negotiation_sim",
    "title": "Negotiation Sim",
    "tier": 4,
    "domain": "social",
    "icon": "🤝",
    "learning_objectives": [
      "Prepare for a negotiation with clear goals",
      "Practice persuasion with evidence",
      "Find win-win solutions",
      "Know when to compromise and when to hold firm"
    ],
    "initial_state": {
      "scenario": null,
      "your_goal": null,
      "other_party_goal": null,
      "leverage_points": []
    },
    "events": [
      {
        "description": "Choose your negotiation scenario:",
        "event_type": "choice",
        "choices": [
          {
            "id": "raise",
            "label": "Ask your boss for a raise at your part-time job",
            "icon": "💰",
            "cost": null,
            "effect": "Raise negotiation! You've worked here 6 months, always on time, and took on extra responsibilities. Your current rate is $12/hour, similar jobs pay $14-15."
          },
          {
            "id": "deadline",
            "label": "Negotiate a deadline extension with your teacher",
            "icon": "📅",
            "cost": null,
            "effect": "Academic negotiation! Your big project overlaps with two other deadlines. You need 3 extra days. The teacher values responsibility and communication."
          },
          {
            "id": "group_decision",
            "label": "Negotiate with your team about project direction",
            "icon": "👥",
            "cost": null,
            "effect": "Team negotiation! You want to go one direction, two teammates want another. You need consensus to move forward."
          }
        ]
      },
      {
        "description": "Preparation is 90% of negotiation. Before you walk in, you need to know: your goal, your best alternative if they say no (BATNA), and what the other side cares about. What do you prepare first?",
        "event_type": "choice",
        "choices": [
          {
            "id": "research",
            "label": "Research: what's the market rate / typical policy / team history?",
            "icon": "🔍",
            "cost": null,
            "effect": "Data is power! You found comparable rates/precedents that support your position. Facts are more persuasive than feelings."
          },
          {
            "id": "their_perspective",
            "label": "Think about what the other side wants and fears",
            "icon": "🧠",
            "cost": null,
            "effect": "Empathy as strategy! Your boss wants to keep good employees, your teacher wants to be fair, your team wants a good project. Understanding their goals helps you propose win-wins."
          },
          {
            "id": "your_batna",
            "label": "Figure out your BATNA — what happens if they say no?",
            "icon": "🛡️",
            "cost": null,
            "effect": "BATNA = Best Alternative To a Negotiated Agreement. Knowing your fallback gives you confidence and a clear walk-away point."
          }
        ]
      },
      {
        "description": "You're in the negotiation. You've made your case with evidence. The other party says 'I hear you, but I can only offer about half of what you're asking.' How do you respond?",
        "event_type": "choice",
        "choices": [
          {
            "id": "counter",
            "label": "Counter with a specific number between your ask and their offer",
            "icon": "🎯",
            "cost": null,
            "effect": "Meeting in the middle shows flexibility! A specific counter (not 'maybe' or 'I guess') demonstrates you know your worth."
          },
          {
            "id": "ask_why",
            "label": "Ask 'What's driving that limit?' — understand their constraints",
            "icon": "❓",
            "cost": null,
            "effect": "Understanding their 'why' opens new solutions! Maybe there's a budget cycle, policy, or timeline you can work with."
          },
          {
            "id": "add_value",
            "label": "Propose non-monetary value: flexible schedule, title change, future review",
            "icon": "➕",
            "cost": null,
            "effect": "Expanding the pie! When they can't give dollars, maybe they can give other things you value. Creative negotiation!"
          }
        ]
      },
      {
        "description": "The negotiation is wrapping up. You didn't get everything you wanted, but you got more than the initial offer. How do you close?",
        "event_type": "choice",
        "choices": [
          {
            "id": "summarize",
            "label": "Summarize the agreement clearly: 'So we've agreed to X, Y, Z?'",
            "icon": "📋",
            "cost": null,
            "effect": "Clear summary prevents misunderstandings! Both parties confirm the same terms. Put it in writing if possible."
          },
          {
            "id": "future_check",
            "label": "Set a date to revisit: 'Can we check in on this in 3 months?'",
            "icon": "📅",
            "cost": null,
            "effect": "Built-in follow-up! This negotiation isn't the last one. A future check-in keeps the door open for more."
          },
          {
            "id": "gratitude",
            "label": "Thank them for their time and flexibility",
            "icon": "🙏",
            "cost": null,
            "effect": "Ending with gratitude preserves the relationship! Negotiations are between people, not positions. You'll work with this person again."
          }
        ]
      },
      {
        "description": "Reflection: What did you learn about negotiation?",
        "event_type": "choice",
        "choices": [
          {
            "id": "preparation_key",
            "label": "Preparation made the biggest difference",
            "icon": "📝",
            "cost": null,
            "effect": "Absolutely! Knowing your facts, their perspective, and your BATNA meant you were never caught off guard."
          },
          {
            "id": "relationship_matters",
            "label": "The relationship matters as much as the outcome",
            "icon": "🤝",
            "cost": null,
            "effect": "Win-win > win-lose! A good negotiation strengthens the relationship. A scorched-earth win often costs more long-term."
          },
          {
            "id": "practice_helps",
            "label": "It gets easier with practice — this was a good start",
            "icon": "💪",
            "cost": null,
            "effect": "Negotiation is a muscle! Every conversation where you advocate for yourself builds the skill. This was great practice."
          }
        ]
      }
    ],
    "recap_template": "You practiced negotiation from preparation through closing! You learned about BATNA, evidence-based persuasion, creative solutions, and relationship-preserving communication. These skills serve you in career, relationships, and daily life.",
    "positive_framing_rules": [
      "Never frame negotiation as adversarial or aggressive",
      "Celebrate compromise as a sign of skill, not weakness",
      "Frame all outcomes as learning experiences"
    ],
    "ai_variation_allowed": [
      "Change the negotiation scenario",
      "Vary the other party's responses",
      "Add different cultural contexts for negotiation"
    ],
    "max_turns": 18
  },
  {
    "id": "tier4_project_deadline_manager",
    "title": "Project Deadline Manager",
    "tier": 4,
    "domain": "time",
    "icon": "📊",
    "learning_objectives": [
      "Manage a multi-week project with dependencies",
      "Identify critical path and milestones",
      "Handle delays and scope changes",
      "Communicate timeline updates to stakeholders"
    ],
    "initial_state": {
      "project": "school newspaper launch",
      "weeks": 6,
      "team_size": 8,
      "tasks": 12,
      "dependencies": true
    },
    "events": [
      {
        "description": "You're launching the school newspaper in 6 weeks. Tasks and dependencies: Content planning (Week 1) → Article writing (Weeks 2-3) → Editing (Week 4) → Layout design (Week 5) → Printing (Week 6). Meanwhile, ad sales (Weeks 1-3) and photography (Weeks 2-4) run in parallel. What's your critical path?",
        "event_type": "choice",
        "choices": [
          {
            "id": "content_to_print",
            "label": "Content → Writing → Editing → Layout → Print (the longest chain)",
            "icon": "🔗",
            "cost": null,
            "effect": "Correct! This chain has zero slack time. Any delay here delays the whole project."
          },
          {
            "id": "all_critical",
            "label": "Everything is critical — no room for error",
            "icon": "⚠️",
            "cost": null,
            "effect": "Good caution, but parallel tasks (ads, photos) have some flexibility. The key chain is content through printing."
          },
          {
            "id": "start_everything",
            "label": "Start all possible tasks immediately",
            "icon": "🚀",
            "cost": null,
            "effect": "Proactive! Starting parallel tasks early builds buffer time. Smart resource management."
          }
        ]
      },
      {
        "description": "Week 2: Two of your best writers have a school trip and will miss 3 days. That's 30% of the writing phase. How do you adjust?",
        "event_type": "choice",
        "choices": [
          {
            "id": "redistribute",
            "label": "Redistribute their articles to other writers",
            "icon": "📝",
            "cost": null,
            "effect": "Other writers take on 1-2 extra articles each. The writing deadline holds!"
          },
          {
            "id": "extend_writing",
            "label": "Extend writing into Week 4, compress editing",
            "icon": "📅",
            "cost": null,
            "effect": "Writing gets 3 more days, editing is compressed. Tighter for editors but the critical path holds."
          },
          {
            "id": "reduce_scope",
            "label": "Reduce from 20 articles to 16 — quality over quantity",
            "icon": "✂️",
            "cost": null,
            "effect": "Fewer articles but better ones! Scope reduction is a legitimate project management tool."
          }
        ]
      },
      {
        "description": "Week 4: The editing team finds that 5 articles need major rewrites. The layout designer says they need final articles by end of Week 5 or printing gets pushed. What's the plan?",
        "event_type": "choice",
        "choices": [
          {
            "id": "parallel_edit_layout",
            "label": "Start layout with finished articles, edit the 5 in parallel",
            "icon": "🔀",
            "cost": null,
            "effect": "11 articles go to layout now, 5 more slot in as they're finished. Parallel work saves the deadline!"
          },
          {
            "id": "editing_sprint",
            "label": "Weekend editing sprint — all hands on the 5 articles",
            "icon": "⚡",
            "cost": null,
            "effect": "The team rallies! All 16 articles ready by Monday. Extra effort saves the timeline."
          },
          {
            "id": "push_printing",
            "label": "Push printing back 3 days, communicate the delay",
            "icon": "📢",
            "cost": null,
            "effect": "Transparent communication! You inform the principal and adjust. Better a 3-day delay than a rushed product."
          }
        ]
      },
      {
        "description": "Week 5: The principal asks if you can add a 4-page special section on the upcoming science fair. That's scope creep — more pages means more layout time and higher printing costs. How do you handle it?",
        "event_type": "choice",
        "choices": [
          {
            "id": "negotiate_scope",
            "label": "Offer 2 pages now, full section in issue #2",
            "icon": "🤝",
            "cost": null,
            "effect": "Compromise! The principal gets coverage, you keep the timeline. Promise more in the next issue."
          },
          {
            "id": "accept_delay",
            "label": "Accept it but request 1 extra week for launch",
            "icon": "📅",
            "cost": null,
            "effect": "Honest about the timeline impact! Adding scope means adding time. The principal agrees."
          },
          {
            "id": "team_vote",
            "label": "Ask the team if they can handle it in the current timeline",
            "icon": "🗳️",
            "cost": null,
            "effect": "The team votes: 2 pages they can handle, 4 is too much. You counter-propose 2 pages to the principal."
          }
        ]
      },
      {
        "description": "Launch day! The newspaper is printed and ready for distribution. What did you learn about project management?",
        "event_type": "choice",
        "choices": [
          {
            "id": "critical_path",
            "label": "Critical path management keeps projects on track",
            "icon": "🔗",
            "cost": null,
            "effect": "The critical path concept saved you from panic when delays hit non-critical tasks."
          },
          {
            "id": "communication",
            "label": "Communicating early about problems prevents bigger problems",
            "icon": "📢",
            "cost": null,
            "effect": "Transparency with stakeholders built trust and gave you room to adjust."
          },
          {
            "id": "flexibility",
            "label": "Plans change — the skill is adjusting while keeping the goal",
            "icon": "🌊",
            "cost": null,
            "effect": "No project goes exactly to plan. Your ability to adapt is the real skill!"
          }
        ]
      }
    ],
    "recap_template": "You managed a complex project from planning to launch! You identified critical paths, handled delays, managed scope changes, and communicated with stakeholders. These are professional-level project management skills.",
    "positive_framing_rules": [
      "Never say the project is falling apart or at risk",
      "Frame delays as normal project challenges with solutions",
      "Celebrate leadership and communication"
    ],
    "ai_variation_allowed": [
      "Change the project type",
      "Vary the specific delays and challenges",
      "Add different stakeholder dynamics"
    ],
    "max_turns": 18
  },
  {
    "id": "tier4_college_app_timeline",
    "title": "College App Timeline",
    "tier": 4,
    "domain": "time",
    "icon": "🎓",
    "learning_objectives": [
      "Manage multiple long-term deadlines",
      "Coordinate parallel application processes",
      "Handle stress and prioritize self-care",
      "Build backward from deadlines"
    ],
    "initial_state": {
      "month": "September",
      "applications": 6,
      "deadlines": {
        "early_action": "November 1",
        "regular": "January 1",
        "scholarships": "December-February"
      },
      "tasks": [
        "essays",
        "recommendations",
        "test_scores",
        "activities_list",
        "financial_aid"
      ]
    },
    "events": [
      {
        "description": "It's September. You're applying to 6 schools: 2 early action (Nov 1 deadline), 4 regular decision (Jan 1). Each needs: essays, recommendations (ask 6 weeks ahead), test scores (sent 4 weeks ahead), activities list, and financial aid forms. How do you start?",
        "event_type": "choice",
        "choices": [
          {
            "id": "backward_plan",
            "label": "Work backward from Nov 1 — what needs to start NOW?",
            "icon": "⏪",
            "cost": null,
            "effect": "Backward planning! Recommendations need asking by Sept 20, test scores sent by Oct 1, essays drafted by Oct 15. Clear timeline!"
          },
          {
            "id": "common_first",
            "label": "Start with tasks shared across all apps (activities list, common essay)",
            "icon": "📋",
            "cost": null,
            "effect": "Efficient! The common app essay and activities list work for all 6 schools. Do them once, use them everywhere."
          },
          {
            "id": "priority_school",
            "label": "Focus on your top-choice school's early action first",
            "icon": "🌟",
            "cost": null,
            "effect": "Top choice gets your best energy! Once that's submitted, you can adapt materials for other schools."
          }
        ]
      },
      {
        "description": "October: You have 3 essays to write, SAT scores to send, and a teacher says they need 3 more weeks for your recommendation (pushing past Nov 1). Meanwhile, midterms are next week.",
        "event_type": "choice",
        "choices": [
          {
            "id": "ask_another_teacher",
            "label": "Ask a different teacher who can meet the deadline",
            "icon": "👩‍🏫",
            "cost": null,
            "effect": "New recommender, same quality! Sometimes backup plans are the best plans."
          },
          {
            "id": "switch_to_regular",
            "label": "Move that school from early action to regular decision",
            "icon": "📅",
            "cost": null,
            "effect": "Strategic pivot! Regular decision gives the original teacher time. One less Nov 1 deadline reduces stress too."
          },
          {
            "id": "polite_reminder",
            "label": "Send a polite reminder with the deadline",
            "icon": "📧",
            "cost": null,
            "effect": "The teacher apologizes and prioritizes yours! Sometimes a gentle nudge is all that's needed. Advocacy skills!"
          }
        ]
      },
      {
        "description": "November: Early action apps submitted! But now you have 4 regular decision apps, 3 scholarship deadlines (Dec 15, Jan 15, Feb 1), and the FAFSA (financial aid) due by Jan 1. Plus finals in December. How do you map the next 2 months?",
        "event_type": "choice",
        "choices": [
          {
            "id": "calendar_block",
            "label": "Block every deadline on a calendar, work backward from each",
            "icon": "📅",
            "cost": null,
            "effect": "Visual timeline! You can see exactly when crunch periods overlap and plan rest days around them."
          },
          {
            "id": "batch_tasks",
            "label": "Batch similar tasks: all essays one week, all forms another",
            "icon": "📦",
            "cost": null,
            "effect": "Batching reduces context-switching! Essay brain one week, form brain the next."
          },
          {
            "id": "weekly_goals",
            "label": "Set weekly goals with specific deliverables",
            "icon": "📊",
            "cost": null,
            "effect": "Week 1: 2 essays. Week 2: FAFSA + 1 scholarship. Week 3: finals study. Week 4: remaining apps. Clear and achievable!"
          }
        ]
      },
      {
        "description": "December crunch: finals AND application deadlines in the same 2-week window. You're feeling stretched. What's your self-care strategy?",
        "event_type": "choice",
        "choices": [
          {
            "id": "schedule_breaks",
            "label": "Schedule 30-minute breaks between work blocks",
            "icon": "☕",
            "cost": null,
            "effect": "Breaks prevent burnout! Research shows regular breaks improve both focus and output quality."
          },
          {
            "id": "ask_help",
            "label": "Ask family/friends to help with smaller tasks (proofreading, form filling)",
            "icon": "🤝",
            "cost": null,
            "effect": "Delegating isn't weakness — it's smart management! Your parent proofreads while you focus on essays."
          },
          {
            "id": "cut_perfection",
            "label": "Good enough is good enough — stop over-editing",
            "icon": "✅",
            "cost": null,
            "effect": "Perfectionism is the enemy of done! Your 4th revision is usually as good as your 10th."
          }
        ]
      },
      {
        "description": "January 2: Everything is submitted! Looking back at the last 4 months, what's your biggest takeaway about managing long-term timelines?",
        "event_type": "choice",
        "choices": [
          {
            "id": "start_early",
            "label": "Starting early gave me flexibility when surprises hit",
            "icon": "🏃",
            "cost": null,
            "effect": "Front-loading work creates buffer time. The recommendation delay didn't become a crisis because you started in September!"
          },
          {
            "id": "systems",
            "label": "Having a system (calendar, checklists) kept me sane",
            "icon": "📋",
            "cost": null,
            "effect": "Systems beat willpower! When your brain is tired, the system keeps you on track."
          },
          {
            "id": "self_care",
            "label": "Taking care of myself made the work better, not slower",
            "icon": "🧘",
            "cost": null,
            "effect": "Well-rested you produces better essays than burned-out you. Self-care is productivity!"
          }
        ]
      }
    ],
    "recap_template": "You managed 6 college applications across 4 months with overlapping deadlines! You built backward from deadlines, handled surprises, and maintained your well-being. These skills apply to any complex long-term project.",
    "positive_framing_rules": [
      "Never say the student is falling behind or stressed out",
      "Frame busy periods as manageable with good planning",
      "Celebrate self-advocacy and self-care as strengths"
    ],
    "ai_variation_allowed": [
      "Change the number and types of schools",
      "Vary the specific deadline conflicts",
      "Add different support system scenarios"
    ],
    "max_turns": 18
  },
  {
    "id": "tier4_work_life_balance",
    "title": "Work-Life Balance Sim",
    "tier": 4,
    "domain": "time",
    "icon": "⚖️",
    "learning_objectives": [
      "Balance part-time work with academics and social life",
      "Recognize burnout signals and adjust",
      "Make trade-offs across life domains",
      "Set boundaries and communicate them"
    ],
    "initial_state": {
      "hours_per_week": 168,
      "school_hours": 35,
      "sleep_hours": 56,
      "available_hours": 77,
      "work_hours": 0,
      "study_hours": 0,
      "social_hours": 0,
      "self_care_hours": 0
    },
    "events": [
      {
        "description": "You're a junior with 77 hours/week after school and sleep. Your part-time job wants 15-20 hours, you need ~15 hours for homework/study, and you want time for friends, hobbies, and yourself. How do you allocate your 77 hours?",
        "event_type": "choice",
        "choices": [
          {
            "id": "balanced",
            "label": "Work 15hr + Study 15hr + Social 10hr + Self-care 7hr = 47hr (30 flex)",
            "icon": "⚖️",
            "cost": null,
            "effect": "Balanced with 30 hours of flex time for meals, commuting, and spontaneous things. Sustainable!"
          },
          {
            "id": "work_heavy",
            "label": "Work 20hr + Study 15hr + Social 5hr + Self-care 5hr = 45hr (32 flex)",
            "icon": "💼",
            "cost": null,
            "effect": "More money but less social and self-care time. The question is: can you sustain this for months?"
          },
          {
            "id": "study_heavy",
            "label": "Work 12hr + Study 20hr + Social 8hr + Self-care 7hr = 47hr (30 flex)",
            "icon": "📚",
            "cost": null,
            "effect": "Academic focus! Less income but your GPA will thank you. Depends on your priorities."
          }
        ]
      },
      {
        "description": "Month 2: Your boss asks you to pick up extra shifts (5 more hours/week). Your grades are good and you could use the money. But your friend says you've been distant lately. What do you do?",
        "event_type": "choice",
        "choices": [
          {
            "id": "decline_shifts",
            "label": "Decline — your current balance is working",
            "icon": "🛑",
            "cost": null,
            "effect": "Setting boundaries! 'No' is a complete sentence. Your boss understands and respects it."
          },
          {
            "id": "temporary",
            "label": "Take them for 3 weeks only (holiday rush)",
            "icon": "📅",
            "cost": null,
            "effect": "Temporary commitment with a clear end date. You earn extra and your friend knows it's short-term."
          },
          {
            "id": "trade_off",
            "label": "Accept but reduce study time — adjust grades expectation",
            "icon": "🔄",
            "cost": null,
            "effect": "Conscious trade-off! You accepted lower grades for higher income this month. As long as it's intentional, not accidental."
          }
        ]
      },
      {
        "description": "Month 4: You notice burnout signs — trouble sleeping, snapping at friends, dreading work. These are signals, not failures. What adjustment do you make?",
        "event_type": "choice",
        "choices": [
          {
            "id": "reduce_work",
            "label": "Ask to drop to 12 hours/week at work",
            "icon": "📉",
            "cost": null,
            "effect": "Less income but more recovery time. Burnout is expensive — catching it early saves you weeks of suffering."
          },
          {
            "id": "self_care_up",
            "label": "Non-negotiable: 1 hour of self-care daily",
            "icon": "🧘",
            "cost": null,
            "effect": "Exercise, journaling, or just quiet time. Protecting self-care hours prevents burnout from getting worse."
          },
          {
            "id": "talk_to_someone",
            "label": "Talk to a counselor, parent, or trusted adult",
            "icon": "💬",
            "cost": null,
            "effect": "Asking for help is strength! A counselor helps you see options you couldn't see while stressed."
          }
        ]
      },
      {
        "description": "End of semester. You've learned a lot about managing your time and energy. What's your biggest insight?",
        "event_type": "choice",
        "choices": [
          {
            "id": "boundaries",
            "label": "Saying no protects what matters most",
            "icon": "🛡️",
            "cost": null,
            "effect": "Boundaries aren't selfish — they're essential. You can't pour from an empty cup."
          },
          {
            "id": "flexible_plan",
            "label": "Plans need regular check-ins and adjustments",
            "icon": "🔄",
            "cost": null,
            "effect": "A monthly review of your time allocation catches problems before they become crises."
          },
          {
            "id": "priorities_shift",
            "label": "Priorities change — and that's okay",
            "icon": "🌊",
            "cost": null,
            "effect": "What mattered in September might shift by February. Regularly reassessing keeps your life aligned with your values."
          }
        ]
      }
    ],
    "recap_template": "You navigated a semester balancing work, school, social life, and self-care! You learned to set boundaries, recognize burnout, and adjust your plan. Work-life balance is a lifelong skill.",
    "positive_framing_rules": [
      "Never say the student is overwhelmed or incapable",
      "Frame burnout signals as useful information, not weakness",
      "Celebrate boundary-setting and self-awareness"
    ],
    "ai_variation_allowed": [
      "Change the specific work and school scenarios",
      "Vary the burnout signals and responses",
      "Add positive milestone celebrations"
    ],
    "max_turns": 18
  }
];

export default scenarios;
