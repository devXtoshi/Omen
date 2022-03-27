const anchor = require("@project-serum/anchor");

const { SystemProgram } = anchor.web3;

const main = async () => {
  console.log("🚀 Starting test...");
  // Configure the client to use the local cluster.
  let provider = anchor.Provider.env();
  anchor.setProvider(provider);

  // Add your test here.
  const program = anchor.workspace.Omenproject;

  // Generate a keypair for the initialization
  let generatedKey = anchor.web3.Keypair.generate();

  const tx = await program.rpc.initialize({
    accounts: {
      baseAccount: generatedKey.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [generatedKey],
  });

  console.log("Your transaction signature", tx);
  let account = await program.account.baseAccount.fetch(generatedKey.publicKey);
  console.log("👀 Project Count", account.totalProjects.toString());

  // Add project here
  await program.rpc.addProject(
    "https://media.giphy.com/media/720g7C1jz13wI/giphy.gif",
    "Harry Porter",
    "gif",
    {
      accounts: {
        baseAccount: generatedKey.publicKey,
        user: provider.wallet.publicKey,
      },
    }
  );

  // Get account to see update
  account = await program.account.baseAccount.fetch(generatedKey.publicKey);
  console.log("👀 Project Count", account.totalProjects.toString());
  console.log('👀 Project List', account.projectList);
};

const runMain = async () => {
  try {
    await main();
    await process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
