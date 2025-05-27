# 🏛️ DAO Platform - Sui Blockchain Governance Platform

<div align="center">
  <img src="public/Submark_dao.svg" alt="DAO Logo" width="120" height="110">
  
  **A comprehensive decentralized governance platform built on the Sui blockchain**
  
  [![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Sui](https://img.shields.io/badge/Sui-Blockchain-4FC3F7?style=flat-square)](https://sui.io/)
  [![Account.tech](https://img.shields.io/badge/Account.tech-DAO_SDK-green?style=flat-square)](https://account.tech/)
</div>

## 🎯 Our Vision

The future of governance is **transparent, democratic, and decentralized**. Our DAO platform represents the next generation of organizational management, leveraging blockchain technology to create seamless governance experiences.

## 💡 What We're Building

A **comprehensive DAO governance platform** built on Sui blockchain, designed to empower:

- 🗳️ **Democratic governance** with flexible voting mechanisms (Linear & Quadratic)
- 💰 **Treasury management** with multi-asset support and vault systems
- 📋 **Proposal lifecycle** from creation to execution
- 🔐 **Secure asset management** with locked object tracking
- 🏪 **Multi-DAO support** for organizations of all sizes
- 📱 **Modern interface** with responsive design
- 🔗 **Extensible architecture** with dependency management
- 🎁 **NFT & Object support** for comprehensive asset governance

## 🎯 How It Works

1. **Create or Join DAOs** with customizable governance parameters
2. **Stake tokens** to gain voting power and participate in governance
3. **Create proposals** for treasury withdrawals, configuration changes, or dependency updates
4. **Vote on proposals** using your staked voting power
5. **Execute approved proposals** automatically or manually
6. **Manage assets** across multiple vaults and wallets

## 👥 Who We Serve

- **Organizations** seeking decentralized governance solutions
- **Communities** wanting transparent decision-making processes
- **Developers** building on decentralized infrastructure
- **Token holders** who value democratic participation
- **Treasuries** requiring secure multi-signature management

## ✨ Key Features

### 🏛️ **DAO Management**
- Create DAOs with custom governance parameters
- Configure voting rules (Linear or Quadratic voting)
- Set minimum voting thresholds and quorum requirements
- Manage unstaking cooldown periods
- Follow/unfollow DAOs for personalized dashboards

### 🗳️ **Governance & Voting**
- **Proposal Types**:
  - Treasury withdrawals (coins, NFTs, objects)
  - DAO configuration changes
  - Dependency management (enable/disable unverified deps)
- **Voting Mechanisms**:
  - Linear voting (1 token = 1 vote)
  - Quadratic voting (√tokens = voting power)
- **Voting Power Management**:
  - Stake tokens to gain voting power
  - Lock voting power during active proposals
  - Retrieve votes after proposal completion

### 💰 **Treasury & Asset Management**
- **Multi-Asset Support**: Manage coins, NFTs, and custom objects
- **Vault System**: Create and manage multiple treasury vaults
- **Deposit/Withdraw**: Transfer assets between wallets and vaults
- **Asset Locking**: Prevent double-spending during active proposals
- **Real-time Pricing**: Integration with Aftermath for token valuations

### 📋 **Proposal Lifecycle**
- **Creation**: Detailed proposal creation with asset selection
- **Voting Period**: Configurable start/end times with countdown timers
- **Execution**: Automatic or manual execution of approved proposals
- **Status Tracking**: Real-time proposal status and vote tallies
- **History**: Complete audit trail of all governance actions

### 🔐 **Security & Dependencies**
- **Dependency Management**: Track and update core dependencies
- **Version Control**: Monitor package versions and security updates
- **Unverified Dependencies**: Toggle support for external packages
- **Access Control**: Role-based permissions for sensitive operations
- **Asset Protection**: Locked object tracking prevents conflicts

### 🎨 **Modern UI/UX**
- **Responsive Design**: Optimized for desktop, tablet, and mobile
- **Real-time Updates**: Live proposal status and voting updates
- **Intuitive Navigation**: Clean, organized interface design
- **Accessibility**: WCAG compliant components and interactions

## 🏗️ Architecture

Built using a modern tech stack optimized for blockchain governance:

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Blockchain**: Sui blockchain integration via Sui dApp Kit
- **SDK**: Account.tech DAO SDK for governance functionality
- **State Management**: Zustand for efficient state management
- **UI Components**: Radix UI primitives with custom styling
- **Styling**: Tailwind CSS with custom design system
- **Icons**: Lucide React for consistent iconography

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended)
- A Sui wallet (Sui Wallet, Nightly, or compatible)
- Some SUI tokens for gas fees

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd dao-app
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   no env variables for the moment 
   ```
   
4. **Run the development server**
   ```bash
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Building for Production

```bash
pnpm build
pnpm start
```

## 📚 SDK Integration

The platform leverages the Account.tech DAO SDK for governance operations:

```typescript
import { DaoClient } from "@account.tech/dao";

// Initialize DAO client
const client = await DaoClient.init(userAddress, daoId);

// Create a proposal
await client.requestWithdrawAndTransfer(
  transaction,
  intentArgs,
  coins,
  objectIds,
  recipient
);

// Vote on a proposal
await client.vote(transaction, intentKey, "yes");

// Execute approved proposal
await client.execute(transaction, intentKey);
```

## 🛠️ Development

### Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── daos/[id]/         # DAO-specific pages
│   │   ├── wallet/        # Treasury management
│   │   ├── proposals/     # Proposal management
│   │   ├── vaults/        # Vault system
│   │   └── settings/      # DAO configuration
│   ├── createDao/         # DAO creation flow
│   └── components/        # Shared components
├── components/            # Reusable UI components
│   ├── ui/               # Base UI components
│   └── CommonProposalSteps/ # Proposal creation steps
├── hooks/                # Custom React hooks
│   └── useDaoClient.tsx  # DAO SDK integration
├── store/                # Zustand state management
├── utils/                # Utility functions
├── types/                # TypeScript type definitions
└── constants/            # App constants
```

### Key Components

- **DAO Dashboard**: Overview of DAO metrics and recent activity
- **Proposal System**: Complete proposal lifecycle management
- **Treasury Management**: Multi-asset wallet and vault system
- **Voting Interface**: Intuitive voting with power calculations
- **Settings Panel**: DAO configuration and dependency management

### Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm type-check   # Run TypeScript checks
```

## 🔧 Configuration

### DAO Parameters

When creating a DAO, configure these key parameters:

- **Asset Type**: Token used for governance (SUI, USDC, custom tokens)
- **Voting Rule**: Linear (1:1) or Quadratic (√n) voting
- **Auth Voting Power**: Minimum tokens needed to create proposals
- **Max Voting Power**: Maximum voting power cap
- **Minimum Votes**: Minimum votes required for proposal validity
- **Voting Quorum**: Percentage of total supply needed for approval
- **Unstaking Cooldown**: Time delay for unstaking tokens

### Supported Assets

- **Coins**: SUI, USDC, and custom fungible tokens
- **NFTs**: Any Sui-compatible NFT collections
- **Objects**: Custom Move objects and data structures

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Account.tech](https://account.tech/) for the DAO SDK and infrastructure
- [Sui Foundation](https://sui.io/) for the blockchain platform
- [Next.js](https://nextjs.org/) for the React framework
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [Aftermath Finance](https://aftermath.finance/) for price data integration

## 🔗 Links

- [Documentation](https://docs.account.tech/)
- [Sui Documentation](https://docs.sui.io/)
- [Community Discord](https://discord.gg/sui)
- [Twitter](https://twitter.com/SuiNetwork)

---

<div align="center">
  <strong>Built with 🏛️ for decentralized governance on Sui</strong>
</div>
