export const STORAGE_KEYS = {
  entered: "alaiafun_entered",
  mindsetSeen: "alaiafun_mindset_seen",
  visitCount: "alaiafun_visits",
  hearts: "alaiafun_hearts",
  foundHearts: "alaiafun_found_hearts",
  storiesRead: "alaiafun_stories_read",
  thoughts: "alaiafun_thoughts",
  saves: "alaiafun_saves",
  reactions: "alaiafun_reactions",
  quizDone: "alaiafun_quiz_done",
};

export const HEART_UNLOCK = 5;

export const corners = [
  {
    id: "people",
    emoji: "💌",
    title: "stories about people who changed how I think",
    blurb: "Recognition, slow-burns, and unexpected mattering.",
    moods: ["people", "personal"],
  },
  {
    id: "overthink",
    emoji: "🧠",
    title: "things worth overthinking",
    blurb: "For the brain that likes to stay a little longer.",
    moods: ["change-mind", "3am"],
  },
  {
    id: "girlhood",
    emoji: "🎀",
    title: "girlhood, identity, and becoming",
    blurb: "Soft chaos, growing pains, and self-recognition.",
    moods: ["personal", "comforting"],
  },
  {
    id: "places",
    emoji: "✈️",
    title: "places that left something behind",
    blurb: "Travel memories that still echo a little.",
    moods: ["personal", "oddly-specific"],
  },
  {
    id: "work",
    emoji: "💼",
    title: "work, ambition, and figuring life out",
    blurb: "Trying, wanting, and not having it all mapped.",
    moods: ["change-mind", "personal"],
  },
  {
    id: "tiny",
    emoji: "☕",
    title: "tiny observations with bigger feelings underneath",
    blurb: "Small details. Larger aftertaste.",
    moods: ["oddly-specific", "quick"],
  },
  {
    id: "3am",
    emoji: "💭",
    title: "thoughts for 3 AM",
    blurb: "When the room is quiet and your mind is not.",
    moods: ["3am", "emotional-damage"],
  },
  {
    id: "connection",
    emoji: "❤️",
    title: "questions about connection",
    blurb: "Who we keep, who we leave room for.",
    moods: ["people", "answer"],
  },
  {
    id: "random",
    emoji: "📎",
    title: "random things with suspiciously long explanations",
    blurb: "Oddly specific rabbit holes welcome.",
    moods: ["oddly-specific", "funny"],
  },
  {
    id: "mirror",
    emoji: "🪞",
    title: "things you might recognize in yourself",
    blurb: "Not a mirror of me — maybe a soft one of you.",
    moods: ["comforting", "send-friend"],
  },
];

export const moods = [
  { id: "comforting", label: "♡ something comforting" },
  { id: "change-mind", label: "♡ something that might change my mind" },
  { id: "funny", label: "♡ something funny" },
  { id: "personal", label: "♡ something personal" },
  { id: "oddly-specific", label: "♡ something oddly specific" },
  { id: "people", label: "♡ something about people" },
  { id: "quick", label: "♡ something I can read in 2 minutes" },
  { id: "send-friend", label: "♡ something to send to a friend" },
  { id: "emotional-damage", label: "♡ something that gives me emotional damage" },
  { id: "answer", label: "♡ something I can answer afterward" },
  { id: "3am", label: "♡ thoughts for late nights" },
];

export const stories = [
  {
    id: "already-full",
    title:
      "My Life Is Already Full, but I Never Want to Close the Door on Someone Who Could Unexpectedly Matter",
    kicker: "connection · slow-burn · open doors",
    minutes: 4,
    moods: ["people", "personal", "comforting", "change-mind", "answer", "send-friend"],
    corners: ["people", "connection", "mirror", "overthink"],
    centralQuestion: "Can a life feel full and still leave room for someone unexpected?",
    interactive: true,
    paragraphs: [
      {
        type: "p",
        text: "I’m perfectly happy with the people I have in my life. I have friends I love, people I trust, and connections I’m incredibly grateful for. But I also think it’s crazy how meeting just one person can unexpectedly change the trajectory of your life.",
      },
      {
        type: "pause",
        prompt: "Does this remind you of someone?",
        options: ["yes", "not yet", "I’m not sure"],
      },
      {
        type: "p",
        text: "Someone you haven’t met yet could introduce you to something you end up loving, challenge something you’ve believed for years, open a door you didn’t even know existed, or simply understand one oddly specific corner of your brain that nobody else does.",
      },
      {
        type: "constellation",
        prompt: "Who has changed your life in a way they may not realize?",
      },
      {
        type: "p",
        text: "You can have so many people to talk to and still occasionally think, Wait, who do I talk to about this? Not because your friendships are lacking. Maybe the friend who would understand is busy, another finds the topic sensitive, and others simply don’t care about this one very specific thing, and that’s completely okay.",
      },
      {
        type: "float",
        label: "someone who gets it 🙋‍♀️",
      },
      {
        type: "pull",
        text: "Your life can already feel full and still have room for someone you haven’t met yet.",
      },
      {
        type: "p",
        text: "I think that’s partly why I made this page.",
      },
      {
        type: "h2",
        text: "If You Ever Wanna Get to Know Me",
      },
      {
        type: "p",
        text: "I take my connections slow-burn.",
      },
      {
        type: "p",
        text: "When I first meet someone, I’m much more interested in how you think than how much I know about you. Tell me what makes you change your mind. What kind of people you admire. What makes you lose respect for someone? Give me your weirdly specific opinions and the tiny experiences that shaped the way you see the world.",
      },
      {
        type: "p",
        text: "I think there’s a difference between knowing a lot about someone and actually knowing someone.",
      },
      {
        type: "p",
        text: "Some of the people I love most today weren’t people I immediately clicked with. Some I genuinely despised after our first and second meetings, only for something they did on the third to unexpectedly touch my heart and completely change the way I saw them.",
      },
      {
        type: "annotation",
        text: "Have you ever changed your mind about someone?",
      },
      {
        type: "p",
        text: "So I don’t need us to instantly become close. I’d rather discover you slowly, and let you discover me too.",
      },
      {
        type: "p",
        text: "If you ever read something here and think, Wait, I’ve thought about this too, reach out. Maybe we’ll have one really good conversation and go on with our lives. Or maybe you’re one of those people I haven’t met yet who will unexpectedly matter.",
      },
      {
        type: "pull",
        text: "My life is already full. I just don’t think “full” has to mean closed.",
      },
    ],
    takeawayQuestion:
      "What is something about you that people only understand after knowing you for a while?",
  },
  {
    id: "oddly-specific-opinions",
    title: "A Short List of Oddly Specific Opinions I’m Weirdly Committed To",
    kicker: "coming soon · placeholder spark",
    minutes: 2,
    moods: ["oddly-specific", "funny", "quick"],
    corners: ["random", "tiny", "overthink"],
    centralQuestion: "What opinion could you defend for twenty minutes with no notes?",
    interactive: false,
    placeholder: true,
    paragraphs: [
      {
        type: "p",
        text: "This drawer is almost empty on purpose. The first long story is already here — and this little stub exists so Surprise Me has somewhere playful to land while more thoughts arrive.",
      },
      {
        type: "pull",
        text: "Sometimes the most interesting opinion is the one you didn’t know you were waiting to hear yourself say.",
      },
      {
        type: "p",
        text: "Come back later. Or answer a question instead. Or click a heart you almost missed.",
      },
    ],
    takeawayQuestion: "What’s an oddly specific opinion you could give a whole presentation about?",
  },
  {
    id: "tiny-kindness",
    title: "A Small Kindness I Still Think About",
    kicker: "coming soon · soft stub",
    minutes: 2,
    moods: ["comforting", "people", "quick", "send-friend"],
    corners: ["tiny", "people", "3am"],
    centralQuestion: "What small kindness still lives rent-free in your memory?",
    interactive: false,
    placeholder: true,
    paragraphs: [
      {
        type: "p",
        text: "This one is still being written carefully. Soft stories deserve unhurried sentences.",
      },
      {
        type: "p",
        text: "While you wait, maybe sit with the question anyway. Sometimes the prompt is already the gift.",
      },
    ],
    takeawayQuestion: "What small kindness do you still think about?",
  },
];

export const questions = [
  "What is something you changed your mind about recently?",
  "What tiny thing instantly makes you like someone?",
  "What opinion could you give a 20-minute presentation about with zero preparation?",
  "What’s something everyone seems to enjoy that you simply don’t understand?",
  "What makes you lose respect for someone?",
  "What stranger do you still remember?",
  "What is a small kindness you still think about?",
  "What part of yourself took you a long time to understand?",
  "What kind of conversation makes you forget to check your phone?",
  "Who has changed your life in a way they may not realize?",
  "What is something about you that people only understand after knowing you for a while?",
  "Have you ever changed your mind about someone?",
  "What door are you still leaving open, just in case?",
  "What oddly specific corner of your brain feels under-understood?",
];

export const heartMessages = [
  "you found one ♡",
  "curiosity rewarded.",
  "this thought was hiding from you.",
  "+1 tiny discovery",
  "you noticed something small.",
  "okay, you’re paying attention.",
  "this one is for whoever needed it today.",
];

export const surpriseLines = [
  "finding a thought for you…",
  "opening a random drawer…",
  "following a very questionable instinct…",
  "looking for something you didn’t know you needed…",
  "pretending this is fate…",
];

export const loadingLines = [
  "organizing a thought…",
  "overthinking…",
  "connecting completely unrelated ideas…",
  "looking through the archives…",
  "finding a question…",
];

export const quiz = [
  {
    q: "Which idea feels more familiar to you?",
    options: [
      "Some people become important slowly.",
      "Some connections are meaningful even if they do not last.",
    ],
  },
  {
    q: "Which would make you more curious about someone?",
    options: [
      "They changed their mind about something important.",
      "They have a strangely specific opinion about something ordinary.",
    ],
  },
  {
    q: "Which kind of story would you rather read next?",
    options: [
      "Something comforting",
      "Something that challenges me",
      "Something I can’t stop thinking about",
      "Something that reminds me of a person",
    ],
  },
  {
    q: "When a thought lands, what do you usually want to do?",
    options: [
      "Sit with it quietly",
      "Tell someone immediately",
      "Write it down",
      "Follow it into a rabbit hole",
    ],
  },
];

export const secretThoughts = [
  {
    title: "Questions I Keep Coming Back To",
    items: [
      "Is curiosity a form of care?",
      "How much of closeness is timing?",
      "What if “full” is not the opposite of “open”?",
      "Which parts of ourselves only appear in certain conversations?",
    ],
  },
  {
    title: "Small Thoughts for People Who Notice Too Much",
    items: [
      "Paying attention is already a kind of tenderness.",
      "Not every connection needs a plot. Some just need a room.",
      "You can love your people and still wonder who else might understand a tiny corner of you.",
      "The quietest click can still count as courage.",
    ],
  },
];

export function getStory(id) {
  return stories.find((s) => s.id === id);
}

export function storiesByMood(moodId) {
  if (!moodId) return stories;
  return stories.filter((s) => s.moods.includes(moodId));
}

export function storiesByCorner(cornerId) {
  return stories.filter((s) => s.corners.includes(cornerId));
}

export function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}
