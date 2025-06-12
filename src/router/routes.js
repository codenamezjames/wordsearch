const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        name: 'start',
        component: () => import('pages/StartMenu.vue'),
      },
      {
        path: 'game',
        name: 'game',
        component: () => import('pages/GamePage.vue'),
      },
      {
        path: 'challenge',
        name: 'challenge',
        component: () => import('pages/ChallengePage.vue'),
        meta: { requiresActiveChallenge: true },
      },
      {
        path: 'stats',
        name: 'stats',
        component: () => import('pages/StatsPage.vue'),
      },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
