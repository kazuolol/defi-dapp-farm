const { assert } = require('chai')

const DaiToken = artifacts.require('DaiToken')
const DappToken = artifacts.require('DappToken')
const TokenFarm = artifacts.require('TokenFarm')

require('chai')
    .use(require('chai-as-promised'))
    .should()

    //helper function for converting gwei to ether
    function tokens(n) {
        return web3.utils.toWei(n, 'ether')
    }

contract('TokenFarm', ([owner, investor]) => {
    let daiToken, dappToken, tokenFarm
    //before each test, run this code 
    before(async () => {
        daiToken = await DaiToken.new()
        dappToken = await DappToken.new()
        tokenFarm = await TokenFarm.new(daiToken.address, dappToken.address)

        await dappToken.transfer(tokenFarm.address, tokens('1000000'))
        await daiToken.transfer(investor, tokens('100'),{ from: owner })
})

    describe('Mock Dai deployment', async () => {
        it('has a name', async () => {
            
            const name = await daiToken.name()
            assert.equal(name, 'Mock DAI Token')
        })
    })

    describe('Dapp Token deployment', async () => {
        it('has a name', async () => {
            
            const name = await dappToken.name()
            assert.equal(name, 'DApp Token')
        })
    })  

    describe('Token Farm deployment', async () => {
        it('has a name', async () => {
            
            const name = await tokenFarm.name()
            assert.equal(name, 'Dapp Token Farm')
        })

        it('has tokens', async () => {
            let balance = await dappToken.balanceOf(tokenFarm.address)
            assert.equal(balance.toString(), tokens('1000000'))
        })
    }) 

    describe('farming tokens', async () => {
        it('rewards investors for staking their mDai', async () => {
            let result

            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor mDai balance correct before staking')

            //stake mDai 
            await daiToken.approve(tokenFarm.address, tokens('100'), { from: investor })
            await tokenFarm.stakeTokens(tokens('100'), { from: investor })
            //check staking result
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('0'), 'make sure the dai token balance has been depleted')

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('100'), 'make sure the balance in the contract makes sense according to how much was staked')

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('100'), 'investor staking balance is correct after staking')

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'true', 'investor staking balance is correct after staking')
            //issue tokens
            await tokenFarm.issueTokens({ from: owner })
            //check balances after issuance
            result = await dappToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor dapp token balance correct after issuance')
            //ensure that only the owner can issue tokens
            await tokenFarm.issueTokens({ from: investor }).should.be.rejected;
            //unstake the tokens
            await tokenFarm.unstakeTokens({ from: investor })

            // check results aftet unstaking
            result = await daiToken.balanceOf(investor)
            assert.equal(result.toString(), tokens('100'), 'investor gets dai back') // investor gets dai back

            result = await daiToken.balanceOf(tokenFarm.address)
            assert.equal(result.toString(), tokens('0'), 'check to make sure contract is depleted') //check to make sure contract is depleted

            result = await tokenFarm.stakingBalance(investor)
            assert.equal(result.toString(), tokens('0'), 'check to make sure the staking balance of investor is now 0') // check to make sure the staking balance of investor is now 0

            result = await tokenFarm.isStaking(investor)
            assert.equal(result.toString(), 'false', 'investor state correct after unstaking')
        })
    })

    
})