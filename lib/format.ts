export const getTimestamp = () => {
    const currentDate = new Date(Date.now());
    const timestamp = stringifyTo2Digits(currentDate.getHours()) + ':' +
        stringifyTo2Digits(currentDate.getMinutes()) + ':' +
        stringifyTo2Digits(currentDate.getSeconds());
    return timestamp;
};

export const indent = (indentation: number) => '    '.repeat(indentation);

export const stringifyTo2Digits = (value: number) => stringifyToNDigits(value, 2);

const stringifyToNDigits = (value: number, digitsNumber: number) => {
    let result = value.toString();
    while(result.length < digitsNumber) {
        result = '0' + result;
    }
    return result;
};
