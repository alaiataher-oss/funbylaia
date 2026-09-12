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
