'use strict;'

const digitPrepender = (value, digit, digitsNumber) => {
    var result = value.toString();
    while(result.length < digitsNumber) {
        result = digit.toString() + result;
    }
    return result;
};

module.exports = { digitPrepender };
