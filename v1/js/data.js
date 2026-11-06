/*
 * EZ Home prototype: all fake data lives here.
 * Edit names, prices, reviews and dates in this file; app.js reads from it.
 * Nothing here is real. No data is sent anywhere.
 */
window.EZ = window.EZ || {};

EZ.scenario = {
  intro: "You just bought three floating shelves and want them mounted on your living room wall. Use this site to find someone to do it.",
  example: {
    description: "Mount three floating shelves on my living room wall. I already have the shelves and the brackets they came with.",
    location: "Hampden, Baltimore",
    access: "Street parking out front. Ring the bell for the first-floor apartment.",
    day: "2026-10-29",
    time: "morning",
    outcome: "Three shelves stacked one above the other, evenly spaced, level, and strong enough for books and plants."
  }
};

EZ.days = [
  { id: "2026-10-28", label: "Wed, Oct 28", long: "Wednesday, October 28" },
  { id: "2026-10-29", label: "Thu, Oct 29", long: "Thursday, October 29" },
  { id: "2026-10-30", label: "Fri, Oct 30", long: "Friday, October 30" },
  { id: "2026-10-31", label: "Sat, Oct 31", long: "Saturday, October 31" }
];

EZ.times = [
  { id: "morning", label: "Morning", hint: "8 AM to 12 PM" },
  { id: "afternoon", label: "Afternoon", hint: "12 PM to 5 PM" },
  { id: "evening", label: "Evening", hint: "5 PM to 8 PM" }
];

/* Supported task categories (first release). Only "mounting" has providers in this test. */
EZ.categories = [
  {
    id: "mounting",
    name: "Shelf & TV Mounting",
    examples: "shelves, TVs, mirrors, curtain rods, pictures",
    keywords: ["shelf", "shelves", "shelving", "tv", "television", "mount", "mounting", "mirror", "picture", "frame", "art", "hang", "curtain", "rod", "bracket"],
    bookable: true
  },
  {
    id: "drywall",
    name: "Drywall Patching",
    examples: "small holes, dents, cracks",
    keywords: ["drywall", "hole", "holes", "patch", "patching", "crack", "dent", "plaster", "spackle"],
    bookable: false
  },
  {
    id: "assembly",
    name: "Furniture Assembly",
    examples: "desks, bed frames, dressers, bookcases",
    keywords: ["assemble", "assembly", "ikea", "furniture", "desk", "dresser", "bookcase", "bed frame", "wardrobe", "cabinet"],
    bookable: false
  }
];

/* Jobs EZ Home does not handle yet: appliances, plumbing, electrical, HVAC. */
EZ.outOfScope = [
  { area: "Appliance repair", keywords: ["fridge", "refrigerator", "freezer", "washer", "washing machine", "dryer", "dishwasher", "oven", "stove", "microwave", "appliance", "espresso", "coffee machine"] },
  { area: "Plumbing", keywords: ["leak", "leaking", "leaky", "pipe", "pipes", "plumbing", "plumber", "toilet", "sink", "faucet", "drain", "clog", "water heater", "shower"] },
  { area: "Electrical work", keywords: ["outlet", "outlets", "electrical", "electric", "wiring", "wire", "breaker", "light switch", "switch", "ceiling fan", "light fixture", "electrician"] },
  { area: "Heating and cooling", keywords: ["ac", "a/c", "air conditioner", "air conditioning", "hvac", "furnace", "heater", "heating", "thermostat", "vent", "boiler"] }
];

/* Written scope shared by all providers for the shelf job. */
EZ.scope = {
  includes: [
    "Mount 3 floating shelves (customer supplies shelves and brackets)",
    "Find wall studs and use them wherever possible",
    "Level each shelf and space them evenly",
    "Wall anchors for any bracket that can't reach a stud",
    "Clean up dust and take away packaging"
  ],
  excludes: [
    "Patching or painting old holes",
    "Moving furniture heavier than 50 lb"
  ],
  duration: "About 1.5 to 2 hours",
  /* Shown on the completion record. The change-request line is added by app.js. */
  done: [
    "Mounted 3 floating shelves, evenly spaced 14 inches apart",
    "Found the wall studs and used them wherever possible",
    "Checked each shelf with a level",
    "Cleaned up dust and took away the packaging"
  ]
};

/*
 * Keep the providers comparable: same number of reviews each, so no card looks
 * "heavier". `tag` is an internal label for the test log only; it is not shown.
 */
EZ.providers = [
  {
    id: "dana",
    name: "Dana Ortiz",
    first: "Dana",
    initials: "DO",
    tag: "Lowest price",
    jobsThisType: 38,
    jobNoun: "shelf and TV mounting jobs",
    years: 3,
    rating: 4.7,
    ratingCount: 61,
    estimate: 120,
    estimateNote: "Labor and wall anchors included",
    availability: "Fri, Oct 30 or Sat, Oct 31",
    days: ["2026-10-30", "2026-10-31"],
    reviews: [
      { who: "Jen R.", job: "Mounted 2 floating shelves", when: "Sep 2026", stars: 5, text: "Quick and tidy. Shelves are level and she vacuumed up after." },
      { who: "Omar T.", job: "Mounted a 55\" TV", when: "Aug 2026", stars: 4, text: "Good work. Arrived near the end of the window but texted ahead." },
      { who: "Lucas P.", job: "Mounted 3 bathroom shelves", when: "Jul 2026", stars: 5, text: "Asked exactly where I wanted them before drilling. Charged what she quoted." }
    ]
  },
  {
    id: "marcus",
    name: "Marcus Bell",
    first: "Marcus",
    initials: "MB",
    tag: "Most experience",
    jobsThisType: 142,
    jobNoun: "shelf and TV mounting jobs",
    years: 9,
    rating: 4.9,
    ratingCount: 210,
    estimate: 165,
    estimateNote: "Labor and wall anchors included",
    availability: "Thu, Oct 29 or Sat, Oct 31",
    days: ["2026-10-29", "2026-10-31"],
    reviews: [
      { who: "Alicia M.", job: "Mounted 3 floating shelves", when: "Oct 2026", stars: 5, text: "Checked every shelf with a level in front of me. They hold a full row of cookbooks." },
      { who: "Ben K.", job: "Mounted floating shelves on plaster", when: "Sep 2026", stars: 5, text: "Old plaster wall and he knew exactly what anchors to use. Price was what he quoted." },
      { who: "Tasha W.", job: "Mounted 4 picture ledges", when: "Jul 2026", stars: 5, text: "Spaced them exactly how I described in my request." }
    ]
  },
  {
    id: "sam",
    name: "Sam Okafor",
    first: "Sam",
    initials: "SO",
    tag: "Soonest available",
    jobsThisType: 71,
    jobNoun: "shelf and TV mounting jobs",
    years: 5,
    rating: 4.8,
    ratingCount: 104,
    estimate: 145,
    estimateNote: "Labor and wall anchors included",
    availability: "Tomorrow, Wed, Oct 28",
    days: ["2026-10-28", "2026-10-29", "2026-10-30"],
    reviews: [
      { who: "Chris L.", job: "Mounted 2 wall shelves", when: "Oct 2026", stars: 5, text: "Booked him the day before and he showed up in the first ten minutes of the window." },
      { who: "Mei S.", job: "Mounted a floating bookshelf", when: "Aug 2026", stars: 4, text: "Solid work. One bracket needed an extra anchor and he asked before adding it." },
      { who: "Rita G.", job: "Mounted 3 shelves in a nursery", when: "Jun 2026", stars: 5, text: "Explained which anchors he used and why. The shelves feel very solid." }
    ]
  }
];

/* 30-minute arrival windows offered for each day (same for every provider in this test). */
EZ.windows = {
  morning: ["8:00 – 8:30 AM", "9:30 – 10:00 AM", "11:00 – 11:30 AM"],
  afternoon: ["12:30 – 1:00 PM", "2:00 – 2:30 PM", "3:30 – 4:00 PM"],
  evening: ["5:00 – 5:30 PM", "6:30 – 7:00 PM"]
};

/* Mid-job change request (FR-7). */
EZ.change = {
  amount: 25,
  title: "Add 2 heavy-duty anchors for the middle shelf",
  reason: "The wall stud behind your middle shelf is about 3 inches off-center. To keep that shelf centered and strong enough for books, I'd add two heavy-duty toggle anchors.",
  ifApproved: "The middle shelf is mounted centered, with the extra anchors. Your total becomes the original estimate plus $25.",
  ifDeclined: "The middle shelf is mounted on the stud, about 3 inches left of center. Your price stays at the original estimate."
};

EZ.bookingRef = "EZH-24817";
EZ.caseRef = "EZS-5531";
