export const curveABI = [
  {
    inputs: [
      {
        internalType: 'string',
        name: '_name',
        type: 'string'
      },
      {
        internalType: 'string',
        name: '_symbol',
        type: 'string'
      },
      {
        internalType: 'address[]',
        name: '_assets',
        type: 'address[]'
      },
      {
        internalType: 'uint256[]',
        name: '_assetWeights',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'spender',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256'
      }
    ],
    name: 'Approval',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'numeraire',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'reserve',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'weight',
        type: 'uint256'
      }
    ],
    name: 'AssetIncluded',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'derivative',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'numeraire',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'reserve',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'address',
        name: 'assimilator',
        type: 'address'
      }
    ],
    name: 'AssimilatorIncluded',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bool',
        name: 'isEmergency',
        type: 'bool'
      }
    ],
    name: 'EmergencyAlarm',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bool',
        name: 'isFrozen',
        type: 'bool'
      }
    ],
    name: 'FrozenSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address'
      }
    ],
    name: 'OwnershipTransfered',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'alpha',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'beta',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'delta',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'epsilon',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'lambda',
        type: 'uint256'
      }
    ],
    name: 'ParametersSet',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'token',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'redeemer',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256'
      }
    ],
    name: 'PartitionRedeemed',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'trader',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'origin',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'target',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'originAmount',
        type: 'uint256'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'targetAmount',
        type: 'uint256'
      }
    ],
    name: 'Trade',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'from',
        type: 'address'
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'to',
        type: 'address'
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'value',
        type: 'uint256'
      }
    ],
    name: 'Transfer',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [],
    name: 'WhitelistingStopped',
    type: 'event'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_owner',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_spender',
        type: 'address'
      }
    ],
    name: 'allowance',
    outputs: [
      {
        internalType: 'uint256',
        name: 'allowance_',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_spender',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256'
      }
    ],
    name: 'approve',
    outputs: [
      {
        internalType: 'bool',
        name: 'success_',
        type: 'bool'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_derivative',
        type: 'address'
      }
    ],
    name: 'assimilator',
    outputs: [
      {
        internalType: 'address',
        name: 'assimilator_',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_account',
        type: 'address'
      }
    ],
    name: 'balanceOf',
    outputs: [
      {
        internalType: 'uint256',
        name: 'balance_',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'curve',
    outputs: [
      {
        internalType: 'int128',
        name: 'alpha',
        type: 'int128'
      },
      {
        internalType: 'int128',
        name: 'beta',
        type: 'int128'
      },
      {
        internalType: 'int128',
        name: 'delta',
        type: 'int128'
      },
      {
        internalType: 'int128',
        name: 'epsilon',
        type: 'int128'
      },
      {
        internalType: 'int128',
        name: 'lambda',
        type: 'int128'
      },
      {
        internalType: 'uint256',
        name: 'totalSupply',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [
      {
        internalType: 'uint8',
        name: '',
        type: 'uint8'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_deposit',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_deadline',
        type: 'uint256'
      }
    ],
    name: 'deposit',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'bytes32[]',
        name: 'merkleProof',
        type: 'bytes32[]'
      },
      {
        internalType: 'uint256',
        name: '_deposit',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_deadline',
        type: 'uint256'
      }
    ],
    name: 'depositWithWhitelist',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'derivatives',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'emergency',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_curvesToBurn',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_deadline',
        type: 'uint256'
      }
    ],
    name: 'emergencyWithdraw',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'withdrawals_',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_derivative',
        type: 'address'
      }
    ],
    name: 'excludeDerivative',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'frozen',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'index',
        type: 'uint256'
      },
      {
        internalType: 'address',
        name: 'account',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256'
      },
      {
        internalType: 'bytes32[]',
        name: 'merkleProof',
        type: 'bytes32[]'
      }
    ],
    name: 'isWhitelisted',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'liquidity',
    outputs: [
      {
        internalType: 'uint256',
        name: 'total_',
        type: 'uint256'
      },
      {
        internalType: 'uint256[]',
        name: 'individual_',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'merkleRoot',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'numeraires',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_origin',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_target',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_originAmount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_minTargetAmount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_deadline',
        type: 'uint256'
      }
    ],
    name: 'originSwap',
    outputs: [
      {
        internalType: 'uint256',
        name: 'targetAmount_',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    name: 'reserves',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: '_emergency',
        type: 'bool'
      }
    ],
    name: 'setEmergency',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bool',
        name: '_toFreezeOrNotToFreeze',
        type: 'bool'
      }
    ],
    name: 'setFrozen',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_alpha',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_beta',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_feeAtHalt',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_epsilon',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_lambda',
        type: 'uint256'
      }
    ],
    name: 'setParams',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'bytes4',
        name: '_interface',
        type: 'bytes4'
      }
    ],
    name: 'supportsInterface',
    outputs: [
      {
        internalType: 'bool',
        name: 'supports_',
        type: 'bool'
      }
    ],
    stateMutability: 'pure',
    type: 'function'
  },
  {
    inputs: [],
    name: 'symbol',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_origin',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_target',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_maxOriginAmount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_targetAmount',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_deadline',
        type: 'uint256'
      }
    ],
    name: 'targetSwap',
    outputs: [
      {
        internalType: 'uint256',
        name: 'originAmount_',
        type: 'uint256'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [
      {
        internalType: 'uint256',
        name: 'totalSupply_',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_recipient',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256'
      }
    ],
    name: 'transfer',
    outputs: [
      {
        internalType: 'bool',
        name: 'success_',
        type: 'bool'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_sender',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_recipient',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_amount',
        type: 'uint256'
      }
    ],
    name: 'transferFrom',
    outputs: [
      {
        internalType: 'bool',
        name: 'success_',
        type: 'bool'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_newOwner',
        type: 'address'
      }
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'turnOffWhitelisting',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [],
    name: 'viewCurve',
    outputs: [
      {
        internalType: 'uint256',
        name: 'alpha_',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'beta_',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'delta_',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'epsilon_',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: 'lambda_',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_deposit',
        type: 'uint256'
      }
    ],
    name: 'viewDeposit',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      },
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_origin',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_target',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_originAmount',
        type: 'uint256'
      }
    ],
    name: 'viewOriginSwap',
    outputs: [
      {
        internalType: 'uint256',
        name: 'targetAmount_',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_origin',
        type: 'address'
      },
      {
        internalType: 'address',
        name: '_target',
        type: 'address'
      },
      {
        internalType: 'uint256',
        name: '_targetAmount',
        type: 'uint256'
      }
    ],
    name: 'viewTargetSwap',
    outputs: [
      {
        internalType: 'uint256',
        name: 'originAmount_',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_curvesToBurn',
        type: 'uint256'
      }
    ],
    name: 'viewWithdraw',
    outputs: [
      {
        internalType: 'uint256[]',
        name: '',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address'
      }
    ],
    name: 'whitelistedDeposited',
    outputs: [
      {
        internalType: 'uint256',
        name: '',
        type: 'uint256'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'whitelistingStage',
    outputs: [
      {
        internalType: 'bool',
        name: '',
        type: 'bool'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: '_curvesToBurn',
        type: 'uint256'
      },
      {
        internalType: 'uint256',
        name: '_deadline',
        type: 'uint256'
      }
    ],
    name: 'withdraw',
    outputs: [
      {
        internalType: 'uint256[]',
        name: 'withdrawals_',
        type: 'uint256[]'
      }
    ],
    stateMutability: 'nonpayable',
    type: 'function'
  }
]
