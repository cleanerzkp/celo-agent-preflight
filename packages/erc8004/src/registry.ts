import type { Address, PublicClient } from "viem";

export const identityRegistryAbi = [
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }]
  },
  {
    type: "function",
    name: "getAgentWallet",
    stateMutability: "view",
    inputs: [{ name: "agentId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }]
  }
] as const;

export interface IdentityRegistryAgent {
  readonly registry: Address;
  readonly agentId: bigint;
  readonly owner: Address;
  readonly metadataURI: string;
  readonly agentWallet: Address;
  readonly blockNumber: bigint;
}

export async function readIdentityRegistryAgent({
  client,
  registry,
  agentId
}: {
  readonly client: PublicClient;
  readonly registry: Address;
  readonly agentId: bigint;
}): Promise<IdentityRegistryAgent> {
  const blockNumber = await client.getBlockNumber();
  const [owner, metadataURI, agentWallet] = await Promise.all([
    client.readContract({
      address: registry,
      abi: identityRegistryAbi,
      functionName: "ownerOf",
      args: [agentId],
      blockNumber
    }),
    client.readContract({
      address: registry,
      abi: identityRegistryAbi,
      functionName: "tokenURI",
      args: [agentId],
      blockNumber
    }),
    client.readContract({
      address: registry,
      abi: identityRegistryAbi,
      functionName: "getAgentWallet",
      args: [agentId],
      blockNumber
    })
  ]);

  return {
    registry,
    agentId,
    owner,
    metadataURI,
    agentWallet,
    blockNumber
  };
}
