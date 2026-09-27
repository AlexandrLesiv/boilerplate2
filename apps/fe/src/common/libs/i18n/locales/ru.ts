import type { Translations } from './en';

export const ru: Translations = {
  nav: {
    home: 'Главная',
    news: 'Новости',
    login: 'Войти',
  },
  pages: {
    news: {
      title: 'Hacker News',
      description: 'Топ материалы с Hacker News',
      loading: 'Загрузка…',
      score: (n: number) => `${n} очков`,
      by: (user: string) => `автор ${user}`,
      comments: (n: number) => `${n} комментариев`,
    },
    home: {
      title: 'Главная',
      welcomeAnon: 'Добро пожаловать! Пожалуйста, войдите.',
      welcomeUser: (email: string) => `Добро пожаловать, ${email}!`,
    },
    login: {
      title: 'Вход',
      emailLabel: 'Электронная почта',
      passwordLabel: 'Пароль',
      submitBtn: 'Войти',
      submittingBtn: 'Вход…',
      errorInvalidCredentials: 'Неверный адрес почты или пароль',
    },
  },
};
