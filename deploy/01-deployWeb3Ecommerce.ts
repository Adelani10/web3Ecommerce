import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatNetworkConfig, HardhatRuntimeEnvironment } from "hardhat/types";
import {
  VERIFICATION_BLOCK_CONFIRMATIONS,
  developmentChains,
} from "../helper-hardhat-config";
import verify from "../utils/verify";

const deployWeb3Ecommerce: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { deployments, getNamedAccounts, ethers, network } = hre;

  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const waitBlockConfirmations = developmentChains.includes(network.name)
    ? 1
    : VERIFICATION_BLOCK_CONFIRMATIONS;

  const args: any[] = [];
  const web3Ecommerce = await deploy("Web3Ecommerce", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: waitBlockConfirmations,
  });

  if (developmentChains.includes(network.name) && process.env.SEPOLIA_RPC_URL) {
    await verify(web3Ecommerce.address, args);
    log("verification done");
  }
};

export default deployWeb3Ecommerce;

deployWeb3Ecommerce.tags = ["all", "web3Ecommerce"];
