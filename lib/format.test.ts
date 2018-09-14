import { expect } from 'chai';
import { describe, it } from 'mocha';
import * as format from './format';

describe('Format', () => {

    it('should indent with 4 spaces', () => {
        const fourSpaces = '    ';
        const oneIndentation = format.indent(1);
        expect(oneIndentation).to.equal(fourSpaces);

        const twelveSpaces = fourSpaces + fourSpaces + fourSpaces;
        const threeIndentations = format.indent(3);
        expect(threeIndentations).to.equal(twelveSpaces);
    });

    it('should prepend 0 to 1-digit number', () => {
        const numberValue = 1;
        const twoDigitStringNumber = '01';
        const stringNumber = format.stringifyTo2Digits(numberValue);
        expect(stringNumber).to.equal(twoDigitStringNumber);
    });
});