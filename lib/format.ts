'use strict;'

export const digitPrepender = (value: number, digit: number, digitsNumber: number) => {
    var result = value.toString();
    while(result.length < digitsNumber) {
        result = digit.toString() + result;
    }
    return result;
};
