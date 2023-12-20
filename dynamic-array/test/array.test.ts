import {
  web3,
  Project,
  TestContractParams,
  addressFromContractId,
  AssetOutput,
  DUST_AMOUNT,
  encodeByteVec
} from '@alephium/web3'
import { expectAssertionError, randomContractId, testAddress, testNodeWallet } from '@alephium/web3-test'
import { deployToDevnet } from '@alephium/cli'
import { Get, Update, Push, Pop, Sum, DynamicArrayForLong } from '../artifacts/ts'
import exp from 'constants'

// Convert a number array to a ByteVec, each number is 4 bytes
function arrayToByteVec(array: number[]): string {
  const buffer = Buffer.alloc(array.length * 4)
  array.forEach((value, index) => buffer.writeUInt32BE(value, index * 4))
  return buffer.toString('hex')
}

function testGet(array: number[], index: number, expected: number) {
  it(`test get ${array} ${index} ${expected}`, async () => {
    const testResult = await DynamicArrayForLong.tests.get({
      testArgs: { array: arrayToByteVec(array), index: BigInt(index) }
    })
    expect(testResult.returns).toEqual(BigInt(expected))
  })
}

function testUpdate(array: number[], index: number, value: number, expected: number[]) {
  it(`test update ${array} ${index} ${value}`, async () => {
    const testResult = await DynamicArrayForLong.tests.update({
      testArgs: { array: arrayToByteVec(array), index: BigInt(index), value: BigInt(value) }
    })
    expect(testResult.returns).toEqual(arrayToByteVec(expected))
  })
}

function testPush(array: number[], value: number, expected: number[]) {
  it(`test push ${array} ${value}`, async () => {
    const testResult = await DynamicArrayForLong.tests.push({
      testArgs: { array: arrayToByteVec(array), value: BigInt(value) }
    })
    expect(testResult.returns).toEqual(arrayToByteVec(expected))
  })
}

function testPop(array: number[], expected: number[]) {
  it(`test pop ${array}`, async () => {
    const testResult = await DynamicArrayForLong.tests.pop({
      testArgs: { array: arrayToByteVec(array) }
    })
    expect(testResult.returns).toEqual(arrayToByteVec(expected))
  })
}

function testSum(array: number[], expected: number) {
  it(`test sum ${array}`, async () => {
    const testResult = await DynamicArrayForLong.tests.sum({
      testArgs: { array: arrayToByteVec(array) }
    })
    expect(testResult.returns).toEqual(BigInt(expected))
  })
}

describe('unit tests', () => {
  beforeAll(async () => {
    web3.setCurrentNodeProvider('http://127.0.0.1:22973')
    await Project.build()
  })

  it('test get empty array', async () => {
    // Cannot use empty array
    await expect(
      DynamicArrayForLong.tests.get({
        testArgs: { array: arrayToByteVec([]), index: 0n }
      })
    ).rejects.toThrow('VM execution error: InvalidBytesSliceArg')
  })
  testGet([2, 3, 5], 0, 2)
  testGet([2, 3, 5], 1, 3)
  testGet([2, 3, 5], 2, 5)

  it('test update empty array', async () => {
    // Cannot use empty array
    await expect(
      DynamicArrayForLong.tests.update({
        testArgs: { array: arrayToByteVec([]), index: 0n, value: 0n }
      })
    ).rejects.toThrow('VM execution error: InvalidBytesSliceArg')
  })
  testUpdate([2, 3, 5], 0, 7, [7, 3, 5])
  testUpdate([2, 3, 5], 1, 7, [2, 7, 5])
  testUpdate([2, 3, 5], 2, 7, [2, 3, 7])

  testPush([], 7, [7])
  testPush([2, 3], 7, [2, 3, 7])
  testPush([2, 3, 5], 7, [2, 3, 5, 7])

  it('test pop empty array', async () => {
    // Cannot use empty array
    await expect(
      DynamicArrayForLong.tests.pop({
        testArgs: { array: arrayToByteVec([]) }
      })
    ).rejects.toThrow('VM execution error: ArithmeticError')
  })
  testPop([2], [])
  testPop([2, 3], [2])
  testPop([2, 3, 5], [2, 3])

  it('test sum empty array', async () => {
    // Cannot use empty array
    await expect(
      DynamicArrayForLong.tests.sum({
        testArgs: { array: arrayToByteVec([]) }
      })
    ).rejects.toThrow('VM execution error: AssertionFailedWithErrorCode')
  })
  testSum([2], 2)
  testSum([2, 3], 5)
  testSum([2, 3, 5], 10)
})
