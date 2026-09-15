/** @typedef {{
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  content: string[];
  theme: string;
  readingTime: number;
  publishedAt?: string;
  status: "draft" | "published";
  featured?: boolean;
}} Story */

/** @type {Story[]} */
export const STORIES = [
  {
    id: "already-full",
    slug: "already-full",
    title:
      "My Life Is Already Full, but I Never Want to Close the Door on Someone Who Could Unexpectedly Matter",
    subtitle: "On open doors, slow-burn connection, and room that remains",
    excerpt:
      "I’m perfectly happy with the people I have in my life. But meeting just one person can unexpectedly change the trajectory of yours, and mine.",
    theme: "Connection",
    readingTime: 4,
    publishedAt: "2026-09-12",
    status: "published",
    featured: true,
    content: [
      "I’m perfectly happy with the people I have in my life. I have friends I love, people I trust, and connections I’m incredibly grateful for. But I also think it’s crazy how meeting just one person can unexpectedly change the trajectory of your life.",
      "Someone you haven’t met yet could introduce you to something you end up loving, challenge something you’ve believed for years, open a door you didn’t even know existed, or simply understand one oddly specific corner of your brain that nobody else does.",
      "You can have so many people to talk to and still occasionally think, Wait, who do I talk to about this? Not because your friendships are lacking. Maybe the friend who would understand is busy, another finds the topic sensitive, and others simply don’t care about this one very specific thing, and that’s completely okay.",
      "Your life can already feel full and still have room for someone you haven’t met yet.",
      "I think that’s partly why I made this page.",
      "I take my connections slow-burn.",
      "When I first meet someone, I’m much more interested in how you think than how much I know about you. Tell me what makes you change your mind. What kind of people you admire. What makes you lose respect for someone? Give me your weirdly specific opinions and the tiny experiences that shaped the way you see the world.",
      "I think there’s a difference between knowing a lot about someone and actually knowing someone.",
      "Some of the people I love most today weren’t people I immediately clicked with. Some I genuinely despised after our first and second meetings, only for something they did on the third to unexpectedly touch my heart and completely change the way I saw them.",
      "So I don’t need us to instantly become close. I’d rather discover you slowly, and let you discover me too.",
      "If you ever read something here and think, Wait, I’ve thought about this too, reach out. Maybe we’ll have one really good conversation and go on with our lives. Or maybe you’re one of those people I haven’t met yet who will unexpectedly matter.",
      "My life is already full. I just don’t think “full” has to mean closed.",
    ],
  },
  {
    id: "read-this-when-incredibly-sad",
    slug: "read-this-when-youre-incredibly-sad",
    title: "Read This When You’re Incredibly Sad",
    subtitle: "Not a motivational speech. Just company, and maybe a laugh.",
    excerpt:
      "I’m not going to tell you to be patient, stay strong, or that everything happens for a reason. Not today. Instead, I’m trading a little dignity for five seconds of peace in your brain.",
    theme: "Things I’m Still Learning",
    readingTime: 5,
    publishedAt: "2026-09-13",
    status: "published",
    featured: true,
    content: [
      "Okay, I might be starting a little “read this when…” series because sometimes, I think this is what I actually needed when I felt a certain way.",
      "But not in the way you think.",
      "I’m not going to tell you be patient, stay strong, this too shall pass, or everything happens for a reason.",
      "Not today.",
      "Because chances are, I don’t even know you personally. How am I supposed to tell you, you’re so kind, you’re so strong, you’re so amazing?!",
      "Like, girl, what if you’re actually a horrible person? I don’t know you.",
      "Instead, I just want you to feel like you’re talking to someone new, someone who isn’t trying to validate you, fix you, or turn your sadness into a motivational speech.",
      "A good friend once told me that when I’m sad, he wouldn’t say, “Be strong, Al.”",
      "He’d just try to make me laugh.",
      "So today, I’m doing the same.",
      "At the expense of my own dignity.",
      "When I was in elementary school, I once posted a picture of my undiez online (not me wearing them ofc, only the product).",
      "Just the undiez. On their own. Having their own little photoshoot.",
      "And why did I post them?",
      "Because I thought the color was pretty.",
      "That’s literally it.",
      "Apparently, 10-year-old me looked at a pair of undiez and thought, Wow. The internet deserves to see this.",
      "No context. No marketing strategy. No target audience.",
      "Just product. Vision. Execution.",
      "Then the next day, a teacher confronted me.",
      "“Why did you post that?”",
      "And that was probably the first time it occurred to me that my latest creative project was not being received well by critics.",
      "Did I tell the truth?",
      "Absolutely not.",
      "I immediately said:",
      "“My sister pranked me.”",
      "And of course, she did not. It was all me.",
      "My poor sister was somewhere peacefully existing, completely unaware that she had just been framed for an undiez-related cybercrime committed entirely by me.",
      "Imagine being her. You wake up, go about your day, and meanwhile, your little sister is at school using you as her legal defense for distributing undiez content online.",
      "Anyway, I immediately deleted the post as soon as I got home.",
      "The evidence disappeared.",
      "But unfortunately, my memory has excellent cloud storage.",
      "I have no idea what happened to you today, and I’m not going to pretend that a stupid childhood story can make it hurt less.",
      "But if your brain gave you even five seconds of peace imagining a tiny girl proudly launching an undiez campaign because of the ✨pretty color✨ then immediately throwing her innocent sister under the bus when the authorities got involved…",
      "Well.",
      "My dignity died for something.",
      "I might regret sharing this story online.",
      "But maybe that’s the point.",
      "We regret things we do. We cringe at things we say. We replay moments we wish we could undo.",
      "That’s part of being alive.",
      "So, you’re allowed to regret, feel embarrassed, disappointed, or upset about what happened.",
      "Feel it.",
      "Sit with it for a while.",
      "But you don’t have to stay stuck there forever.",
      "When you’re ready, let’s focus on what you can do next. Figure out what can be fixed. Apologize if you need to. Learn from it. Take the next step.",
      "You can regret something without letting it become your entire identity.",
      "You can be sad without living in the sadness forever.",
      "And you can move forward, even if you have to do it while carrying the memory of your own undiez-related cybercrime.",
    ],
  },
  {
    id: "all-you-can-eat-success",
    slug: "all-you-can-eat-success",
    title: "How an All-You-Can-Eat Restaurant Made Me Rethink What I Call Success",
    subtitle: "On buffet math, miso soup, and the life attached to ambition",
    excerpt:
      "I used to treat my stomach like an investment portfolio at every all-you-can-eat. It took me years to notice that getting my money’s worth and actually enjoying dinner are not the same sentence.",
    theme: "Things I’m Still Learning",
    readingTime: 8,
    publishedAt: "2026-09-15",
    status: "published",
    featured: true,
    content: [
      "Living in Jakarta means you are never too far away from an all-you-can-eat advertisement. I could be sitting in traffic and see a billboard for unlimited Japanese BBQ, open Instagram and immediately get a video of someone reviewing a new Korean buffet, then walk into a mall and be greeted by another promise of 90 minutes of unlimited meat for Rp300,000. I have always loved these places, but for most of my life, I approached them with a very specific strategy: eat as much of the expensive stuff as possible.",
      "I would arrive hungry and immediately begin doing invisible accounting in my head. Beef was good, and more beef was always better. Rice was dangerous because it filled me up too quickly, vegetables seemed almost financially irresponsible, and side dishes were acceptable only in moderation. Dessert deserved some space because I loved it, but never enough to interfere with the main objective. I was not literally opening a spreadsheet at the table and calculating the retail price of every slice of meat, but mentally, I was not that far away from doing it.",
      "The logic actually seemed quite reasonable. Suppose the dinner costs Rp300,000 and 100 grams of meat would cost around Rp50,000 if ordered separately. By that calculation, I would need to eat at least 600 grams of meat before I could confidently say that I had gotten my money’s worth. Now imagine, for the sake of my completely unscientific model, that 100 grams of meat takes up around 10 percent of my stomach capacity. Every 10 percent allocated to meat would therefore give me Rp50,000 worth of food.",
      "Then there was the miso soup. Suppose a bowl costs only Rp10,000 but takes up roughly the same 10 percent of my stomach capacity. Why would I use 10 percent of a scarce resource on Rp10,000 worth of soup when the same space could hold Rp50,000 worth of beef? Somehow, without realizing it, I had turned my stomach into an investment portfolio and miso soup into an inefficient allocation of capital.",
      "For years, I thought this was simply the smart way to eat at a buffet. I would leave painfully full but strangely accomplished, satisfied that I had gotten my money’s worth. It took me an embarrassingly long time to realize that “I got my money’s worth” and “I really enjoyed that dinner” are not necessarily the same sentence.",
      "The strange thing was that there were plenty of foods I genuinely wanted but deliberately skipped. Sometimes the fried rice smelled amazing, sometimes the kimchi tasted better than the meat, and almost every time, somewhere after several plates of rich BBQ, what I actually wanted was a warm bowl of miso soup. Still, I would remind myself that soup was cheap and filling, then return to the meat because that was what I was supposed to be eating.",
      "The first few plates were genuinely delicious, but eventually there would come a point when I was no longer particularly hungry and the next slice did not taste nearly as exciting as the first. Even then, stopping felt strangely like losing, so I would keep going until I had technically succeeded at the dinner I had designed for myself, only to realize that I never had the warm bowl of soup I had wanted the entire time.",
      "Recently, I started thinking that perhaps the calculation itself had never been the problem. The numbers made sense within the little model I had created. What I had missed was everything that could not fit inside it.",
      "Rp10,000 might be the price of a bowl of miso soup, but it cannot capture the warmth of wrapping my hands around it in an overly air-conditioned restaurant, the relief of that first salty sip after several plates of rich meat, or the strange nostalgia of a familiar taste that brings me back to another dinner, another trip, or another version of myself. It cannot capture the people sitting across from me, the conversation happening around the table, or that quiet feeling of taking a sip and thinking, this is exactly what I wanted right now.",
      "The price of the soup and the experience of having it were answering two entirely different questions, and somehow that small realization followed me out of the restaurant.",
      "As we grow older, we become remarkably good at recognizing the things we are supposed to want. Certain opportunities, titles, institutions, places, and milestones barely need explaining because everyone already understands why they are desirable. They are the wagyu of adulthood, appealing before we have even had the chance to ask ourselves whether we personally like the taste.",
      "There is nothing wrong with wanting those things, and I certainly do not want to pretend that ambition or achievement is shallow. I love difficult goals, I enjoy becoming better at things, and many of the experiences I am most grateful for came because I was willing to work hard for them. I hope I never lose that part of myself. What I am trying to become more careful about is the moment when “I would be proud to achieve this” quietly turns into “I would be happy living the life that comes with it.”",
      "Those are not always the same thing.",
      "There are paths we want partly because imagining ourselves reaching the end feels incredible. We picture entering the selective room, earning the recognizable title, or finally being able to say that we did the difficult thing, and sometimes we get there and discover that it really is everything we hoped it would be. Sometimes the wagyu tastes exactly as good as advertised.",
      "But sometimes we arrive somewhere we spent years wanting to reach and feel a strange obligation to be happier than we actually are. Instead of asking whether we genuinely enjoy being there, we remind ourselves that we worked incredibly hard for it, that many people would love to have the same opportunity, that it will be good for our future, and that an earlier version of ourselves once dreamed about being exactly where we are now.",
      "Every one of those statements can be true while still leaving one question unanswered: do I like the life attached to this achievement?",
      "I have started to think that some of the things that answer that question are surprisingly ordinary. Liking the people you spend your Tuesdays with matters. Laughing over lunch matters. Feeling useful matters. Having someone teach you something patiently matters. Having enough energy left at the end of the day to care about things that have nothing to do with your responsibilities matters. Looking forward to going somewhere, rather than simply being proud that you earned the right to be there, matters.",
      "They are the miso soup of adulthood. They may not be the reason you chose the restaurant, they may not be the centerpiece of the table, and they may not be the first thing you mention when someone asks what you ordered, but they can quietly determine whether the meal itself feels good.",
      "Perhaps this is why I no longer think choosing the soup necessarily means settling for less. Sometimes knowing what nourishes you requires more self-awareness than automatically reaching for whatever appears most desirable. There will always be another plate, another opportunity, another difficult room to enter, and another version of life that sounds slightly more impressive when explained to somebody else, so at some point we have to decide what we are actually hungry for.",
      "At an all-you-can-eat restaurant, our bodies eventually make that decision for us. Life is less helpful. Nobody appears to tell us that we have accumulated enough achievement or recognition and can finally begin enjoying everything we worked so hard to obtain.",
      "This is why the question I want to ask myself more often is no longer simply, “Am I getting the most out of this?” but rather, “Am I enjoying what I am getting?” The distinction is small, but the first question makes me think about what else I could acquire, while the second makes me pay attention to the life I am already experiencing.",
      "Maybe success is not about choosing between ambition and contentment because I do not think the two are opposites. Perhaps it is about becoming precise enough to recognize which ambitions are genuinely ours and learning to distinguish between wanting something because we want the life attached to it and wanting something because we like the idea of being someone who achieved it. Both can look exactly the same from the outside, but they come from two very different kinds of hunger.",
      "I still go to all-you-can-eat restaurants, and I still eat an unreasonable amount of meat because personal growth has its limits. These days, though, if I want rice, I try to eat the rice, if the side dish tastes amazing, I get another serving, and if I want dessert before I have mathematically extracted every possible rupiah from the buffet, I let myself have dessert. Most importantly, if what I really want after several plates of beef is a warm bowl of miso soup, I hope I am getting better at simply having the soup, and I imagine my cholesterol appreciates this philosophical development too.",
      "The soup still costs Rp10,000, and the beef might still cost five times as much, but I no longer think that tells me which one deserves the next 10 percent of my stomach. Sometimes I want the beef, sometimes I want the soup, and perhaps the point is simply learning to notice the difference.",
      "I hope I can eventually say the same about the way I build my life, because it would be a strange thing to spend years successfully reaching for everything that looks most desirable on the menu, only to realize that somewhere along the way, I became so good at choosing what I thought I should want that I stopped noticing what I was actually hungry for."
    ],
  },
];

export function publishedStories() {
  return STORIES.filter((s) => s.status === "published").sort((a, b) =>
    (b.publishedAt || "").localeCompare(a.publishedAt || "")
  );
}

export function getStoryBySlug(slug) {
  return publishedStories().find((s) => s.slug === slug || s.id === slug) || null;
}

export function storyThemes() {
  return [...new Set(publishedStories().map((s) => s.theme))].sort();
}

export function adjacentStories(slug) {
  const list = publishedStories();
  const i = list.findIndex((s) => s.slug === slug || s.id === slug);
  if (i < 0) return { prev: null, next: null };
  return {
    prev: list[i - 1] || null,
    next: list[i + 1] || null,
  };
}
