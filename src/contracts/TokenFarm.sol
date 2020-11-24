pragma solidity ^0.5.0;
import './DappToken.sol';
import './DaiToken.sol';

contract TokenFarm {

    string public name = "Dapp Token Farm";
    DaiToken public daiToken;
    DappToken public dappToken;
    address public owner;

    address[] public stakers;
    mapping(address => uint) public stakingBalance;
    mapping (address => bool) public hasStaked;
    mapping (address => bool) public isStaking;

    constructor(DaiToken _daiToken, DappToken _dappToken) public {
        daiToken = _daiToken;
        dappToken = _dappToken;
        owner = msg.sender;
        
    }

    //1. Stake Tokens (Deposit)
    function stakeTokens(uint _amount) public {
        //require amount of tokens > 0
        require(_amount > 0, "amount cannot be zero");

        daiToken.transferFrom(msg.sender, address(this), _amount);
        //update staking balance
        stakingBalance[msg.sender] = stakingBalance[msg.sender] + _amount;
        // add users to staking arr only if they haven't staked yet
        if(!hasStaked[msg.sender]) {
            stakers.push(msg.sender);
        }
        // update state of user who is interacting w contract
        hasStaked[msg.sender] = true;
        isStaking[msg.sender] = true;
    }

    //2. Unstake tokens (withdraw)

    function unstakeTokens() public {
        //fetch staking balance
        uint balance = stakingBalance[msg.sender];
        //require balance is greater than 0
        require(balance > 0, "staking balance cannot be zero");
        //transfer mDai tokens to this contract
        daiToken.transfer(msg.sender, balance);
        //reset staking balance
        stakingBalance[msg.sender] = 0;
        //update staking status
        isStaking[msg.sender] = false;
    }

    //3 Issuing tokens 

    function issueTokens() public {
        //only owner ca call this func
        require(msg.sender == owner, "caller must be the owner");
        //issue tokens to all stakers... 
        for(uint i = 0; i < stakers.length; i++) {
            address recipient = stakers[i];
            uint balance = stakingBalance[recipient];
            if(balance > 0) {
                dappToken.transfer(recipient, balance);
            }
         }
    }


}