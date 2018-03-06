const random = require('random-js')();
const uuidv4 = require('uuid/v4');

// Validator
const { checkSchema } = require('express-validator/check');

class Factory {
    constructor(name, lower, upper, childCount) {
        this.name = name;
        this.childCount = childCount;
        this.setLowerAndUpper(lower, upper);
        this._id = uuidv4();
    }

    setLower(lower) {
        this.lower = lower;
    }

    setUpper(upper) {
        this.upper = upper;
    }

    setLowerAndUpper(lower, upper) {
        if (lower > upper) {
            throw "Lower bound cannot be greater than the upper bound";
        }
        if (lower === upper) {
            throw "Lower and upper bound cannot be equal";
        }
        if (lower < 0 || upper < 0) {
            throw "Lower bound cannot be negative";
        }
        this.setLower(lower);
        this.setUpper(upper);
        this.generateChildren();
    }

    generateChildren() {
        this.children = [];
        for(let i = 0; i < this.childCount; i++) {
            this.children.push(random.integer(this.lower, this.upper));
        }
    }
}

const newFactoryValidationSchema = {
    lower: {
        in: ['body'],
        errorMessage: 'Lower bound is invalid',
        isInt: true,
        toInt: true
    },
    upper: {
        in: ['body'],
        errorMessage: 'Upper bound is invalid',
        isInt: true,
        toInt: true
    },
    childCount: {
        in: ['body'],
        errorMessage: 'Child count is invalid',
        isInt: {
            options: { min: 1, max: 15 }
        },
        toInt: true
    },
    name: {
        in: ['body'],
        isLength: {
            errorMessage: 'Name cannot be empty',
            options: { min: 1 }
        }
    }
};
const newFactoryValidation = checkSchema(newFactoryValidationSchema);

const patchFactoryValidationSchema = {
    uuid: {
        errorMessage: 'UUID is invalid',
        isUUID: true
    },
    lower: {
        in: ['body'],
        errorMessage: 'Lower bound is invalid',
        isInt: true,
        toInt: true
    },
    upper: {
        in: ['body'],
        errorMessage: 'Upper bound is invalid',
        isInt: true,
        toInt: true
    },
    childCount: {
        in: ['body'],
        errorMessage: 'Child count is invalid',
        isInt: {
            options: { min: 1, max: 15 }
        },
        toInt: true
    },
    name: {
        in: ['body'],
        isLength: {
            errorMessage: 'Name cannot be empty',
            options: { min: 1 }
        }
    }
};
const patchFactoryValidation = checkSchema(patchFactoryValidationSchema);

module.exports = {
    Factory: Factory,
    newFactoryValidation: newFactoryValidation,
    patchFactoryValidation: patchFactoryValidation
};