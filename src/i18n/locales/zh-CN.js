import zhTW from './zh-TW';

export default {
  ...zhTW,
  nav: {
    ...zhTW.nav,
    home: '首页',
    videos: '视频',
    performers: '表演者',
    fanclub: '粉丝俱乐部',
    news: '新闻',
    becomePerformer: '成为表演者',
    login: '登录',
    register: '注册',
    search: '搜索视频、表演者...',
    howItWorks: '运作方式',
  },
  language: {
    select: '选择语言',
    en: 'English',
    tl: 'Tagalog',
    zhCN: '简体中文',
    th: 'ไทย',
    vi: 'Tiếng Việt',
  },
  footer: {
    ...zhTW.footer,
    brand: 'FLESHLAB',
    description: '面向已验证亚洲表演者、粉丝与合作伙伴的现代创作者生态。',
    explore: '探索',
    community: '社群',
    legal: '法律',
    terms: '服务条款',
    privacy: '隐私政策',
    dmca: 'DMCA',
    compliance2257: '2257 合规',
  },
};