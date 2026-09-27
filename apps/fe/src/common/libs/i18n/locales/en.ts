export const en = {
  nav: {
    home: 'Home',
    news: 'News',
    login: 'Login',
  },
  pages: {
    news: {
      title: 'Hacker News',
      description: 'Top stories from Hacker News',
      loading: 'Loading stories…',
      score: (n: number) => `${n} points`,
      by: (user: string) => `by ${user}`,
      comments: (n: number) => `${n} comments`,
    },
    home: {
      title: 'Home',
      welcomeAnon: 'Welcome! Please log in.',
      welcomeUser: (email: string) => `Welcome, ${email}!`,
    },
    login: {
      title: 'Login',
      emailLabel: 'Email',
      passwordLabel: 'Password',
      submitBtn: 'Log in',
      submittingBtn: 'Logging in…',
      errorInvalidCredentials: 'Invalid email or password',
    },
  },
};

export type Translations = typeof en;
