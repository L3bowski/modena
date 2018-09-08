export const indent = (indentation: number) => '    '.repeat(indentation);

export const stringifyTo2Digits = (value: number) => stringifyToNDigits(value, 2);

export const stringifyToNDigits = (value: number, digitsNumber: number) => {
    let result = value.toString();
    while(result.length < digitsNumber) {
        result = '0' + result;
    }
    return result;
};
