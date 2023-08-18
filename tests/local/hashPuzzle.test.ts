import { expect } from 'chai'
import { MethodCallOptions, sha256, toByteString } from 'scrypt-ts'
import { HashPuzzle } from '../../src/contracts/hashPuzzle'
import { getDefaultSigner } from '../utils/helper'

const plainText = 'abc'
const byteString = toByteString(plainText, true)
const sha256Data = sha256(byteString)

describe('Test SmartContract `HashPuzzle`', () => {
    before(async () => {
        await HashPuzzle.compile()
    })

    it('should pass the public method unit test successfully.', async () => {
        const hashPuzzle = new HashPuzzle(sha256Data)
        await hashPuzzle.connect(getDefaultSigner())

        const deployTx = await hashPuzzle.deploy(1)
        console.log('HashPuzzle contract deployed: ', deployTx.id)

        const { tx: callTx, atInputIndex } = await hashPuzzle.methods.unlock(
            byteString
        )
        console.log('HashPuzzle contract called: ', callTx.id)

        const result = callTx.verifyScript(atInputIndex)
        expect(result.success, result.error).to.eq(true)
    })
})
