import { expect } from 'chai'

import { HashedMapState } from '../../src/contracts/hashedMapState'
import {
    ByteString,
    HashedMap,
    int2ByteString,
    MethodCallOptions,
    toByteString,
} from 'scrypt-ts'
import { getDefaultSigner } from '../utils/helper'

describe('Test SmartContract `HashedMapState`', () => {
    let map: HashedMap<bigint, ByteString>, stateMap: HashedMapState
    before(async () => {
        await HashedMapState.compile()

        map = new HashedMap<bigint, ByteString>()

        stateMap = new HashedMapState(map)
        await stateMap.connect(getDefaultSigner())
    })

    async function insert(
        instance: HashedMapState,
        key: bigint,
        val: ByteString
    ) {
        const newInstance = instance.next()

        newInstance.hashedmap.set(key, val)

        const { nexts, tx } = await instance.methods.insert(key, val, {
            next: {
                instance: newInstance,
                balance: instance.balance,
            },
        } as MethodCallOptions<HashedMapState>)

        return {
            tx: tx,
            newInstance: nexts[0].instance,
        }
    }

    async function canGet(
        instance: HashedMapState,
        key: bigint,
        val: ByteString
    ) {
        const newInstance = instance.next()

        const { nexts, tx } = await instance.methods.canGet(key, val, {
            next: {
                instance: newInstance,
                balance: instance.balance,
            },
        } as MethodCallOptions<HashedMapState>)

        return {
            tx: tx,
            newInstance: nexts[0].instance,
        }
    }

    async function notExist(instance: HashedMapState, key: bigint) {
        const newInstance = instance.next()

        const { nexts, tx } = await instance.methods.notExist(key, {
            next: {
                instance: newInstance,
                balance: instance.balance,
            },
        } as MethodCallOptions<HashedMapState>)

        return {
            tx: tx,
            newInstance: nexts[0].instance,
        }
    }

    async function update(
        instance: HashedMapState,
        key: bigint,
        val: ByteString
    ) {
        const newInstance = instance.next()
        newInstance.hashedmap.set(key, val)

        const { nexts, tx } = await instance.methods.update(key, val, {
            next: {
                instance: newInstance,
                balance: instance.balance,
            },
        } as MethodCallOptions<HashedMapState>)

        return {
            tx: tx,
            newInstance: nexts[0].instance,
        }
    }

    async function deleteKey(instance: HashedMapState, key: bigint) {
        const newInstance = instance.next()
        newInstance.hashedmap.delete(key)
        const { nexts, tx } = await instance.methods.delete(key, {
            next: {
                instance: newInstance,
                balance: instance.balance,
            },
        } as MethodCallOptions<HashedMapState>)

        return {
            tx: tx,
            newInstance: nexts[0].instance,
        }
    }

    it('insert, canGet, update, delete should pass', async () => {
        const deployTx = await stateMap.deploy(1)
        console.log('HashedMapState contract deployed: ', deployTx.id)

        const { tx: tx1, newInstance: newInstance1 } = await insert(
            stateMap,
            1n,
            toByteString('0001')
        )
        console.log('HashedMapState contract called: ', tx1.id)

        let result = tx1.verifyScript(0)
        expect(result.success, result.error).to.eq(true)

        const { tx: tx2, newInstance: newInstance2 } = await insert(
            newInstance1,
            2n,
            toByteString('0002')
        )
        console.log('HashedMapState contract called: ', tx2.id)
        result = tx2.verifyScript(0)
        expect(result.success, result.error).to.eq(true)

        const { tx: tx3, newInstance: newInstance3 } = await canGet(
            newInstance2,
            2n,
            toByteString('0002')
        )
        console.log('HashedMapState contract called: ', tx3.id)
        result = tx3.verifyScript(0)
        expect(result.success, result.error).to.eq(true)

        const { tx: tx4, newInstance: newInstance4 } = await canGet(
            newInstance3,
            1n,
            toByteString('0001')
        )
        console.log('HashedMapState contract called: ', tx4.id)
        result = tx4.verifyScript(0)
        expect(result.success, result.error).to.eq(true)

        const { tx: tx5, newInstance: newInstance5 } = await update(
            newInstance4,
            1n,
            toByteString('000001')
        )
        console.log('HashedMapState contract called: ', tx5.id)
        result = tx5.verifyScript(0)
        expect(result.success, result.error).to.eq(true)

        const { tx: tx6, newInstance: newInstance6 } = await update(
            newInstance5,
            2n,
            toByteString('000002')
        )
        console.log('HashedMapState contract called: ', tx6.id)
        result = tx6.verifyScript(0)
        expect(result.success, result.error).to.eq(true)

        const { tx: tx7, newInstance: newInstance7 } = await canGet(
            newInstance6,
            1n,
            toByteString('000001')
        )
        console.log('HashedMapState contract called: ', tx7.id)
        result = tx7.verifyScript(0)
        expect(result.success, result.error).to.eq(true)

        const { tx: tx8, newInstance: newInstance8 } = await canGet(
            newInstance7,
            2n,
            toByteString('000002')
        )
        result = tx8.verifyScript(0)
        expect(result.success, result.error).to.eq(true)
        console.log('HashedMapState contract called: ', tx8.id)
        const { tx: tx9, newInstance: newInstance9 } = await deleteKey(
            newInstance8,
            2n
        )
        console.log('HashedMapState contract called: ', tx9.id)
        result = tx9.verifyScript(0)
        expect(result.success, result.error).to.eq(true)

        const { tx: tx10 } = await notExist(newInstance9, 2n)
        console.log('HashedMapState contract called: ', tx10.id)
        result = tx10.verifyScript(0)
        expect(result.success, result.error).to.eq(true)
    })

    it('unlock should pass', async () => {
        const map = new HashedMap<bigint, ByteString>()

        const key = 2n
        const val = toByteString('0a0a0a0a0a')

        const instance = new HashedMapState(map)
        await instance.connect(getDefaultSigner())

        const deployTx = await instance.deploy(1)
        console.log('HashedMapState contract deployed: ', deployTx.id)

        const newInstance = instance.next()

        for (let i = 0; i < 5; i++) {
            newInstance.hashedmap.set(
                BigInt(i),
                int2ByteString(BigInt(i), BigInt(i))
            )
        }

        for (let i = 0; i < 5; i++) {
            if (i === 3) {
                newInstance.hashedmap.delete(key)
            } else if (i == 4) {
                newInstance.hashedmap.set(key, val)
            }
        }

        const { tx } = await instance.methods.unlock(key, val, {
            next: {
                instance: newInstance,
                balance: instance.balance,
            },
        } as MethodCallOptions<HashedMapState>)
        console.log('HashedMapState contract called: ', tx.id)

        const result = tx.verifyScript(0)
        expect(result.success, result.error).to.eq(true)
    })
})
