class Translation {
  constructor(translations = {}) {
    this.translations = translations;
  }

  localize(id, view) {
    const translation = this.translations[id];
    switch (typeof translation) {
      case 'string':
        return translation;
      case 'function':
        return translation(view);
      default:
        return `[[${id}]]`;
    }
  }
}

export default Translation;
