// Never required at VALUE level by main.js — the class below reaches the
// entry through the TYPE world alone (jsdoc `typeof import('./base')`), so
// this file must stay out of the compiled program without breaking it.
class Base {
    constructor() {
        this.x = 1;
    }
}

const BaseFactory = () => {
    return new Base();
};

BaseFactory.Base = Base;

module.exports = BaseFactory;
