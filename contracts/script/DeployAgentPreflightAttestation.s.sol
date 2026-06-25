// SPDX-License-Identifier: Apache-2.0
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {console2} from "forge-std/console2.sol";

import {AgentPreflightAttestation} from "../src/AgentPreflightAttestation.sol";

contract DeployAgentPreflightAttestation is Script {
    uint256 private constant CELO_MAINNET_CHAIN_ID = 42_220;
    uint256 private constant CELO_SEPOLIA_CHAIN_ID = 11_142_220;

    function run() external returns (AgentPreflightAttestation deployed) {
        uint256 chainId = block.chainid;
        uint256 deployerPrivateKey = vm.envOr("DEPLOYER_PRIVATE_KEY", uint256(0));
        address deployer = deployerPrivateKey == 0 ? msg.sender : vm.addr(deployerPrivateKey);

        require(
            chainId == CELO_MAINNET_CHAIN_ID || chainId == CELO_SEPOLIA_CHAIN_ID || chainId == 31_337,
            "Unsupported deployment chain"
        );

        console2.log("Deploying AgentPreflightAttestation");
        console2.log("chainId", chainId);
        console2.log("deployer", deployer);

        if (deployerPrivateKey == 0) {
            vm.startBroadcast();
        } else {
            vm.startBroadcast(deployerPrivateKey);
        }

        deployed = new AgentPreflightAttestation();
        vm.stopBroadcast();

        console2.log("deployed", address(deployed));
    }
}
