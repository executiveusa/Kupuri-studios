export const CYOA_TEMPLATES = {
  pokemon_adventure: {
    id: 'pokemon-adventure',
    name: 'Pokemon Adventure',
    description: 'Create your own Pokemon journey',
    theme: 'pokemon',
    startingPrompt: 'A young Pokemon trainer starts their journey in a quiet village.',
    pages: 5,
  },
  mystery_detective: {
    id: 'mystery-detective',
    name: 'Mystery Detective',
    description: 'Solve a mysterious case',
    theme: 'mystery',
    startingPrompt: 'You arrive at a grand mansion where a crime has occurred.',
    pages: 6,
  },
  fantasy_quest: {
    id: 'fantasy-quest',
    name: 'Fantasy Quest',
    description: 'Embark on an epic fantasy adventure',
    theme: 'fantasy',
    startingPrompt: 'You awaken in a magical forest with no memory of how you got there.',
    pages: 7,
  },
  scifi_space: {
    id: 'scifi-space',
    name: 'Space Explorer',
    description: 'Explore the cosmos',
    theme: 'scifi',
    startingPrompt: 'Your spacecraft has detected an unknown signal from a distant planet.',
    pages: 6,
  },
  educational_stem: {
    id: 'educational-stem',
    name: 'STEM Adventure',
    description: 'Learn through interactive storytelling',
    theme: 'educational',
    startingPrompt: 'You are a young scientist discovering the wonders of the natural world.',
    pages: 5,
  },
  anime_highschool: {
    id: 'anime-highschool',
    name: 'High School Story',
    description: 'Your first day at a magical high school',
    theme: 'anime',
    startingPrompt: 'You arrive at your new high school, unaware of the magical world hidden within.',
    pages: 6,
  },
};

export const STORY_WRITING_PROMPTS = {
  pokemon: `You are writing a Pokemon-themed story. The protagonist is a young trainer discovering their first Pokemon.
    The story should include:
    - A vivid description of the starting location
    - Introduction of a unique Pokemon character
    - At least 2-3 meaningful choices that affect the story direction
    - Themes of friendship, courage, and growth`,

  fantasy: `You are writing a fantasy adventure story. The protagonist discovers they have magical powers.
    The story should include:
    - A richly described magical world
    - Introduction of magical elements and creatures
    - A clear conflict or quest
    - At least 3 meaningful choices`,

  scifi: `You are writing a science fiction story set in space. The protagonist receives a mysterious transmission.
    The story should include:
    - Advanced technology descriptions
    - Alien or extraterrestrial elements
    - A sense of discovery and wonder
    - Meaningful choices that impact the narrative`,

  mystery: `You are writing a mystery story where the protagonist must solve a crime.
    The story should include:
    - Intriguing clues and red herrings
    - Multiple suspects with motives
    - Building suspense
    - Choices that lead to different conclusions`,

  education: `You are writing an educational story that teaches through adventure.
    The story should include:
    - Clear learning objectives
    - Interactive problem-solving
    - Positive reinforcement
    - Vocabulary appropriate for young learners`,

  anime: `You are writing an anime-style story. The protagonist enters a magical school.
    The story should include:
    - Anime tropes and character archetypes
    - School life elements
    - Supernatural or magical elements
    - Character relationships and growth`,
};
