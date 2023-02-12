import { expect } from 'chai'
import { MethodCallOptions, toByteString } from 'scrypt-ts'
import { HelloWorld } from '../../src/contracts/helloWorld'
import { dummySigner, dummyUTXO } from './util/txHelper'

describe('Test SmartContract `HelloWorld`', () => {
    before(async () => {
        await HelloWorld.compile()
    })

    it('should pass the public method unit test successfully.', async () => {
        const helloWorld = new HelloWorld()
        await helloWorld.connect(dummySigner())
        const { tx: callTx, atInputIndex } = await helloWorld.methods.unlock(
            toByteString('hello world', true),
            {
                fromUTXO: dummyUTXO,
            } as MethodCallOptions<HelloWorld>
        )

        const result = callTx.verifyInputScript(atInputIndex)
        expect(result.success, result.error).to.eq(true)
    })
})
