import { expect, use } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import {
    bsv,
    ByteString,
    findSig,
    hash160,
    hash256,
    int2ByteString,
    MethodCallOptions,
    PubKey,
    PubKeyHash,
    toByteString,
} from 'scrypt-ts'
import { Signature } from 'scrypt-ts-lib'
import { BlindEscrow } from '../src/contracts/blindEscrow'
import { getDefaultSigner } from './utils/helper'

use(chaiAsPromised)

describe('Heavy: Test SmartContract `BlindEscrow`', () => {
    let seller: bsv.PrivateKey
    let buyer: bsv.PrivateKey
    let arbiter: bsv.PrivateKey

    // Make sure compressed flag is false
    let sellerPubKey: bsv.PublicKey
    let buyerPubKey: bsv.PublicKey
    let arbiterPubKey: bsv.PublicKey

    let sellerPKH: PubKeyHash
    let buyerPKH: PubKeyHash
    let arbiterPKH: PubKeyHash

    let escrowNonce: ByteString

    let blindEscrow: BlindEscrow

    before(async () => {
        seller = bsv.PrivateKey.fromRandom(bsv.Networks.testnet)
        buyer = bsv.PrivateKey.fromRandom(bsv.Networks.testnet)
        arbiter = bsv.PrivateKey.fromRandom(bsv.Networks.testnet)

        sellerPubKey = new bsv.PublicKey(seller.publicKey.point, {
            compressed: false,
        })
        buyerPubKey = new bsv.PublicKey(buyer.publicKey.point, {
            compressed: false,
        })
        arbiterPubKey = new bsv.PublicKey(arbiter.publicKey.point, {
            compressed: false,
        })

        sellerPKH = hash160(sellerPubKey.toHex())
        buyerPKH = hash160(buyerPubKey.toHex())
        arbiterPKH = hash160(arbiterPubKey.toHex())

        escrowNonce = toByteString('001122334455aabbcc') // TODO

        await BlindEscrow.compile()

        blindEscrow = new BlindEscrow(
            sellerPKH,
            buyerPKH,
            arbiterPKH,
            escrowNonce
        )
    })

    it('should pass release by seller', async () => {
        //// Sig by buyer, stamp by seller.

        // Create "stamp", i.e. seller signature of the escrowNonce.
        const oracleMsg: ByteString =
            escrowNonce + int2ByteString(BlindEscrow.RELEASE_BY_SELLER)
        const hashBuff = Buffer.from(hash256(oracleMsg), 'hex')
        const oracleSigObj = bsv.crypto.ECDSA.sign(hashBuff, seller)
        const oracleSig: Signature = {
            r: BigInt(oracleSigObj['r'].toString()),
            s: BigInt(oracleSigObj['s'].toString()),
        }

        await blindEscrow.connect(getDefaultSigner(buyer))

        await blindEscrow.deploy(1)
        const callContract = async () =>
            blindEscrow.methods.spend(
                (sigResps) => findSig(sigResps, buyer.publicKey),
                PubKey(buyerPubKey.toHex()),
                oracleSig,
                PubKey(sellerPubKey.toHex()),
                BlindEscrow.RELEASE_BY_SELLER,
                {
                    pubKeyOrAddrToSign: buyer.publicKey,
                } as MethodCallOptions<BlindEscrow>
            )
        expect(callContract()).to.not.throw
    })

    it('should pass release by arbiter', async () => {
        //// Sig by buyer, stamp by arbiter.

        const oracleMsg: ByteString =
            escrowNonce + int2ByteString(BlindEscrow.RELEASE_BY_ARBITER)
        const hashBuff = Buffer.from(hash256(oracleMsg), 'hex')
        const oracleSigObj = bsv.crypto.ECDSA.sign(hashBuff, arbiter)
        const oracleSig: Signature = {
            r: BigInt(oracleSigObj['r'].toString()),
            s: BigInt(oracleSigObj['s'].toString()),
        }

        await blindEscrow.connect(getDefaultSigner(buyer))

        await blindEscrow.deploy(1)

        const callContract = async () =>
            blindEscrow.methods.spend(
                (sigResps) => findSig(sigResps, buyer.publicKey),
                PubKey(buyerPubKey.toHex()),
                oracleSig,
                PubKey(arbiterPubKey.toHex()),
                BlindEscrow.RELEASE_BY_ARBITER,
                {
                    pubKeyOrAddrToSign: buyer.publicKey,
                } as MethodCallOptions<BlindEscrow>
            )

        expect(callContract()).to.not.throw
    })

    it('should pass return by buyer', async () => {
        //// Sig by seller, stamp by buyer.

        const oracleMsg: ByteString =
            escrowNonce + int2ByteString(BlindEscrow.RETURN_BY_BUYER)
        const hashBuff = Buffer.from(hash256(oracleMsg), 'hex')
        const oracleSigObj = bsv.crypto.ECDSA.sign(hashBuff, buyer)
        const oracleSig: Signature = {
            r: BigInt(oracleSigObj['r'].toString()),
            s: BigInt(oracleSigObj['s'].toString()),
        }

        await blindEscrow.connect(getDefaultSigner(seller))
        await blindEscrow.deploy(1)
        const callContract = async () =>
            blindEscrow.methods.spend(
                (sigResps) => findSig(sigResps, seller.publicKey),
                PubKey(sellerPubKey.toHex()),
                oracleSig,
                PubKey(buyerPubKey.toHex()),
                BlindEscrow.RETURN_BY_BUYER,
                {
                    pubKeyOrAddrToSign: seller.publicKey,
                } as MethodCallOptions<BlindEscrow>
            )
        expect(callContract()).to.not.throw
    })

    it('should pass return by arbiter', async () => {
        //// Sig by seller, stamp by arbiter.

        const oracleMsg: ByteString =
            escrowNonce + int2ByteString(BlindEscrow.RETURN_BY_ARBITER)
        const hashBuff = Buffer.from(hash256(oracleMsg), 'hex')
        const oracleSigObj = bsv.crypto.ECDSA.sign(hashBuff, arbiter)
        const oracleSig: Signature = {
            r: BigInt(oracleSigObj['r'].toString()),
            s: BigInt(oracleSigObj['s'].toString()),
        }

        await blindEscrow.connect(getDefaultSigner(seller))
        await blindEscrow.deploy(1)

        const callContract = async () =>
            blindEscrow.methods.spend(
                (sigResps) => findSig(sigResps, seller.publicKey),
                PubKey(sellerPubKey.toHex()),
                oracleSig,
                PubKey(arbiterPubKey.toHex()),
                BlindEscrow.RETURN_BY_ARBITER,
                {
                    pubKeyOrAddrToSign: seller.publicKey,
                } as MethodCallOptions<BlindEscrow>
            )

        return expect(callContract()).not.rejected
    })
})
