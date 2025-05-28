import { defineStore } from 'pinia'

export const useCategoriesStore = defineStore('categories', {
  state: () => ({
    categories: {
      animals: [
        'LION',
        'TIGER',
        'ELEPHANT',
        'GIRAFFE',
        'ZEBRA',
        'MONKEY',
        'PENGUIN',
        'DOLPHIN',
        'SHARK',
        'EAGLE',
        'OWL',
        'BEAR',
        'WOLF',
        'FOX',
        'DEER',
      ],
      disney: [
        'MICKEY',
        'MINNIE',
        'DONALD',
        'GOOFY',
        'PLUTO',
        'SIMBA',
        'MUFASA',
        'NALA',
        'TIMON',
        'PUMBAA',
        'ALADDIN',
        'JASMINE',
        'GENIE',
        'JAFAR',
        'ABU',
      ],
      famousLandmarks: [
        'EIFEL',
        'TOWER',
        'STATUE',
        'LIBERTY',
        'PYRAMIDS',
        'COLOSSEUM',
        'TAJMAHAL',
        'GREATWALL',
        'BIGBEN',
        'SYDNEYOPERA',
        'CHRISTREDEEMER',
        'MACHUPICCHU',
        'PETRA',
        'ANGKORWAT',
        'STONEHENGE',
      ],
      friendsAndFamilies: [
        'MOTHER',
        'FATHER',
        'SISTER',
        'BROTHER',
        'GRANDMA',
        'GRANDPA',
        'AUNT',
        'UNCLE',
        'COUSIN',
        'NIECE',
        'NEPHEW',
        'DAUGHTER',
        'SON',
        'WIFE',
        'HUSBAND',
      ],
      fruits: [
        'APPLE',
        'BANANA',
        'ORANGE',
        'GRAPE',
        'WATERMELON',
        'STRAWBERRY',
        'PINEAPPLE',
        'MANGO',
        'KIWI',
        'PEACH',
        'PLUM',
        'CHERRY',
        'LEMON',
        'LIME',
        'BLUEBERRY',
      ],
      greekGods: [
        'ZEUS',
        'HERA',
        'POSEIDON',
        'HADES',
        'ATHENA',
        'APOLLO',
        'ARTEMIS',
        'ARES',
        'APHRODITE',
        'HERMES',
        'HEPHAESTUS',
        'DEMETER',
        'DIONYSUS',
        'HESTIA',
        'PERSEPHONE',
      ],
      harryPotter: [
        'HARRY',
        'RON',
        'HERMIONE',
        'DUMBLEDORE',
        'VOLDEMORT',
        'HAGRID',
        'SNAPE',
        'MALFOY',
        'GINNY',
        'NEVILLE',
        'SIRIUS',
        'LUPIN',
        'MCGONAGALL',
        'HAGRID',
        'DEMENTOR',
      ],
      space: [
        'SUN',
        'MOON',
        'EARTH',
        'MARS',
        'JUPITER',
        'SATURN',
        'NEPTUNE',
        'VENUS',
        'MERCURY',
        'PLUTO',
        'GALAXY',
        'STAR',
        'COMET',
        'ASTEROID',
        'NEBULA',
      ],
      superheroes: [
        'SUPERMAN',
        'BATMAN',
        'SPIDERMAN',
        'IRONMAN',
        'THOR',
        'HULK',
        'WONDERWOMAN',
        'FLASH',
        'CAPTAINAMERICA',
        'BLACKWIDOW',
        'DEADPOOL',
        'WOLVERINE',
        'STORM',
        'CYBORG',
        'AQUAMAN',
      ],
      vampireDiaries: [
        'DAMON',
        'STEFAN',
        'ELENA',
        'CAROLINE',
        'BONNIE',
        'KLAUS',
        'KATHERINE',
        'TYLER',
        'MATT',
        'JEREMY',
        'ALARIC',
        'REBEKAH',
        'KOL',
        'FINN',
        'ELIJAH',
      ],
      vegetables: [
        'CARROT',
        'BROCCOLI',
        'SPINACH',
        'POTATO',
        'TOMATO',
        'CUCUMBER',
        'PEPPER',
        'ONION',
        'GARLIC',
        'CORN',
        'CELERY',
        'ASPARAGUS',
        'CAULIFLOWER',
        'EGGPLANT',
        'ZUCCHINI',
      ],
    },
  }),

  getters: {
    categoryNames: (state) => Object.keys(state.categories),

    getCategoryWords: (state) => (categoryName) => {
      return state.categories[categoryName] || []
    },

    getRandomCategory: (state) => () => {
      const names = Object.keys(state.categories)
      return names[Math.floor(Math.random() * names.length)]
    },

    getRandomWords:
      (state) =>
      (categoryName, count = 10) => {
        const words = state.categories[categoryName] || []
        if (words.length === 0) {
          console.error('No words found for category:', categoryName)
          return []
        }

        // Make sure count doesn't exceed available words
        count = Math.min(count, words.length)

        // Create a copy of the array to shuffle
        const shuffled = [...words]

        // Fisher-Yates shuffle algorithm
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
        }

        return shuffled.slice(0, count)
      },

    getCategoryDisplayName: () => (categoryName) => {
      // Convert camelCase to Title Case
      return categoryName
        .replace(/([A-Z])/g, ' $1')
        .replace(/^./, (str) => str.toUpperCase())
        .trim()
    },
  },
})
