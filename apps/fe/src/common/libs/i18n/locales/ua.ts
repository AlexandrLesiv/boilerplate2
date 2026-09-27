import type { Translations } from './en';

export const ua: Translations = {
  nav: {
    home: 'Головна',
    news: 'Новини',
    login: 'Увійти',
  },
  pages: {
    news: {
      title: 'Hacker News',
      description: 'Топ матеріали з Hacker News',
      loading: 'Завантаження…',
      score: (n: number) => `${n} балів`,
      by: (user: string) => `автор ${user}`,
      comments: (n: number) => `${n} коментарів`,
    },
    home: {
      title: 'Головна',
      welcomeAnon: 'Ласкаво просимо! Будь ласка, увійдіть.',
      welcomeUser: (email: string) => `Ласкаво просимо, ${email}!`,
    },
    login: {
      title: 'Вхід',
      emailLabel: 'Електронна пошта',
      passwordLabel: 'Пароль',
      submitBtn: 'Увійти',
      submittingBtn: 'Вхід…',
      errorInvalidCredentials: 'Неправильна електронна пошта або пароль',
    },
  },
};
