import type { NextPage } from "next";
import Head from "next/head";
import { Fragment, useEffect, useState } from "react";
import { Popover, Dialog, Transition } from "@headlessui/react";
import { MenuIcon, XIcon, LockClosedIcon } from "@heroicons/react/outline";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Program, Provider, web3 } from "@project-serum/anchor";
import idl from "../utils/idl.json";
import kp from "../utils/keypair.json";
// SystemProgram is a reference to the Solana runtime!
const { SystemProgram, Keypair, Connection } = web3;

// Create a keypair for the account that will hold the GIF data.
const arr = Object.values(kp._keypair.secretKey);
const secret = new Uint8Array(arr);
const baseAccount = web3.Keypair.fromSecretKey(secret);

// Get our program's id from the IDL file.
const programID = new PublicKey(idl.metadata.address);

// Controls how we want to acknowledge when a transaction is "done".
const opts = {
  preflightCommitment: "processed",
};

const endpoint = "https://explorer-api.devnet.solana.com";

const connection = new Connection(endpoint);

const navigation = [
  { name: "Add Project", href: "#" },
  { name: "Projects", href: "#" },
  { name: "Marketplace", href: "#" },
  { name: "Stake", href: "#" },
];

const Home: NextPage = () => {
  const { setVisible } = useWalletModal();
  const { wallet, connect, disconnect, connecting, publicKey } = useWallet();
  const walletAnchor = useAnchorWallet();
  const [inputVal, setInputVal] = useState({
    link: "",
    title: "",
    type: "",
  });
  const [projectList, setProjectList] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSetUp = async () => {
    if (wallet !== null) {
      try {
        connect();
      } catch (error) {
        console.log("Error connecting to the wallet: ", (error as any).message);
      }
    }
  };

  useEffect(() => {
    handleSetUp();
  }, [wallet]);

  const getProvider = () => {
    let provider = new Provider(
      connection,
      walletAnchor as any,
      opts.preflightCommitment as any
    );

    return provider;
  };

  const handleLaunchApp = () => {
    try {
      if (!walletAnchor) {
        setVisible(true);
      } else {
        connect();
      }
    } catch (error) {
      console.log("Error Launching app: ", (error as any).message);
    }
  };

  const handleChange = (e: any) => {
    setInputVal({ ...inputVal, [e.target.name]: e.target.value });
  };

  const handleCloseModal = () => {
    setOpen(false);
    setError("");
    setInputVal({
      link: "",
      title: "",
      type: "",
    });
  };

  const handleSubmitProject = async () => {
    if (inputVal.link === "") {
      setError("Project Link is required!");
      return;
    }

    if (inputVal.title === "") {
      setError("Project Title is required!");
      return;
    }

    if (inputVal.type === "") {
      setError("Project Type is required!");
      return;
    }
    await setLoading(true);
    try {
      const provider = getProvider();
      const program = new Program(idl as any, programID, provider);

      await program.rpc.addProject(
        inputVal.link,
        inputVal.title,
        inputVal.type,
        {
          accounts: {
            baseAccount: baseAccount.publicKey,
            user: walletAnchor?.publicKey as any,
          },
        }
      );
      console.log("Project successfully sent to program", inputVal);

      await getProjectList();
      await handleCloseModal();
      await setLoading(false);
    } catch (error) {
      console.log("Error sending GIF:", error);
    }
  };

  const getProjectList = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl as any, programID, provider);
      const account = await program.account.baseAccount.fetch(
        baseAccount.publicKey
      );

      console.log("Got the account", account);
      setProjectList(account.projectList);
    } catch (error) {
      console.log("Error in getProjectList: ", error);
      setProjectList(null as any);
    }
  };

  const createProjectAccount = async () => {
    try {
      const provider = getProvider();
      const program = new Program(idl as any, programID, provider);
      await program.rpc.initialize({
        accounts: {
          baseAccount: baseAccount.publicKey,
          user: walletAnchor?.publicKey as any,
          systemProgram: SystemProgram.programId,
        },
        signers: [baseAccount],
      });
      console.log(
        "Created a new BaseAccount w/ address:",
        baseAccount.publicKey.toString()
      );
      await getProjectList();
    } catch (error) {
      console.log("Error creating BaseAccount account:", error);
    }
  };

  useEffect(() => {
    if (publicKey) {
      console.log("Fetching GIF list...");
      getProjectList();
    }
  }, [wallet, publicKey]);
  return (
    <div>
      <Head>
        <title>Omen</title>
        <meta
          name="description"
          content="Omen - decentralized crowdfunding for gif makers"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {/* <section className="loader_first">
            <div className="circular-spinner"></div>
        </section> <img src="/images/logo.png" alt="logo" />*/}
      <div className="sc-banner banner-bg relative bg-gray-50 overflow-hidden min-h-[100vh]">
        <div className="relative pt-6 pb-16 sm:pb-24">
          <Popover>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <nav
                className="relative flex items-center justify-between sm:h-10 md:justify-center"
                aria-label="Global"
              >
                <div className="flex items-center flex-1 md:absolute md:inset-y-0 md:left-0">
                  <div className="flex items-center justify-between w-full md:w-auto">
                    <a href="#">
                      <span className="sr-only">Workflow</span>
                      <img
                        className="h-8 w-auto sm:h-10"
                        src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
                        alt=""
                      />
                    </a>
                    <div className="-mr-2 flex items-center md:hidden ">
                      <Popover.Button className="bg-om-400 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                        <span className="sr-only">Open main menu</span>
                        <MenuIcon
                          className="h-6 w-6 text-om-200"
                          aria-hidden="true"
                        />
                      </Popover.Button>
                    </div>
                  </div>
                </div>
                {publicKey ? (
                  <div className="hidden md:flex md:space-x-10">
                    {navigation.map((item) => (
                      <a
                        key={item.name}
                        href={item.href}
                        className="font-medium text-gray-500 hover:text-gray-900"
                      >
                        {item.name}
                      </a>
                    ))}
                  </div>
                ) : null}
                <div className="hidden md:absolute md:flex md:items-center md:justify-end md:inset-y-0 md:right-0">
                  {publicKey ? (
                    <span className="inline-flex rounded-md shadow">
                      <a
                        onClick={() => disconnect()}
                        href="#"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-om-400 hover:text-om-200 bg-om-200 hover:bg-om-400"
                      >
                        Disconnect
                      </a>
                    </span>
                  ) : null}
                </div>
              </nav>
            </div>

            <Transition
              as={Fragment}
              enter="duration-150 ease-out"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="duration-100 ease-in"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Popover.Panel
                focus
                className="absolute z-10 top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden"
              >
                <div className="rounded-lg shadow-md bg-om-400 ring-1 ring-black ring-opacity-5 overflow-hidden">
                  <div className="px-5 pt-4 flex items-center justify-between">
                    <div>
                      <img
                        className="h-8 w-auto"
                        src="https://tailwindui.com/img/logos/workflow-mark-indigo-600.svg"
                        alt=""
                      />
                    </div>
                    <div className="-mr-2">
                      <Popover.Button className="bg-om-400 rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500">
                        <span className="sr-only">Close menu</span>
                        <XIcon
                          className="h-6 w-6 text-om-200"
                          aria-hidden="true"
                        />
                      </Popover.Button>
                    </div>
                  </div>
                  {publicKey ? (
                    <div className="px-2 pt-2 pb-3">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  {publicKey ? (
                    <a
                      href="#"
                      onClick={() => disconnect()}
                      className="block w-full px-5 py-3 text-center font-medium text-om-200 bg-om-400 hover:bg-om-400"
                    >
                      Disconnect
                    </a>
                  ) : (
                    <a
                      href="#"
                      onClick={handleLaunchApp}
                      className="block w-full px-5 py-3 text-center font-medium text-om-200 bg-om-400 hover:bg-om-400"
                    >
                      Launch App
                    </a>
                  )}
                </div>
              </Popover.Panel>
            </Transition>
          </Popover>

          <main className="mt-16 mx-auto max-w-7xl px-4 sm:mt-24">
            <div>
              <h1 className=" text-center text-4xl tracking-tight font-extrabold text-om-300 sm:text-5xl md:text-6xl">
                <span className="block xl:inline"> Omen Project </span> <br />
                <span className="block  xl:inline">Directory</span>
              </h1>
              <p className="text-center mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                The next generation gaming ecosystem for IGOs and NFT
              </p>

              {publicKey ? (
                <div className="mt-5">
                  <div className="connected-container text-center mb-10">
                    {walletAnchor && projectList === null ? (
                      <button
                        type="submit"
                        onClick={createProjectAccount}
                        className="text-om-400 hover:text-om-200 bg-om-200 hover:bg-om-400 rounded-md px-5 py-3 cta-button submit-gif-button"
                      >
                        Do One-Time Initialization For Omen Program Account
                      </button>
                    ) : (
                      <button
                        type="submit"
                        onClick={() => setOpen(true)}
                        // onClick={handleSubmitGif}
                        className="text-om-400 hover:text-om-200 bg-om-200 hover:bg-om-400 rounded-md px-5 py-3 cta-button submit-gif-button"
                      >
                        Add Project
                      </button>
                    )}

                    <div className="gif-grid"></div>
                  </div>
                  <ul
                    role="list"
                    className="space-y-12 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:gap-y-12 sm:space-y-0 lg:grid-cols-3 lg:gap-x-8"
                  >
                    {projectList.reverse().map((data: any, idx: any) => (
                      <li key={idx}>
                        <div className="space-y-4">
                          <div className="aspect-w-3 gif-item aspect-h-2">
                            <img
                              className="object-cover shadow-lg rounded-lg"
                              src={data.projectLink}
                              alt=""
                            />
                          </div>

                          <div className="">
                            <div className="text-lg leading-6 font-medium ">
                              <p className="text-om-200">
                                {data.projectTitle} - ({data.projectType})
                              </p>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="mt-5 text-center space-x-7 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                  <a
                     className="text-om-400 hover:text-om-200 bg-om-200 hover:bg-om-400 rounded-md px-5 py-3 cta-button submit-gif-button"
                    data-wow-delay="300ms"
                    data-wow-duration="2500ms"
                    href="#"
                    onClick={handleLaunchApp}
                  >
                    <span className="btn-text">Launch App</span>

                    <span className="hover-shape1" />
                    <span className="hover-shape2" />
                    <span className="hover-shape3" />
                  </a>
                </div>
              )}
            </div>
          </main>

          <Transition.Root show={open} as={Fragment}>
            <Dialog
              as="div"
              className="fixed z-10  inset-0 overflow-y-auto"
              onClose={handleCloseModal}
            >
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Dialog.Overlay className="fixed inset-0 bg-om-500 bg-opacity-75 transition-opacity" />
                </Transition.Child>

                {/* This element is to trick the browser into centering the modal contents. */}
                <span
                  className="hidden sm:inline-block sm:align-middle sm:h-screen"
                  aria-hidden="true"
                >
                  &#8203;
                </span>
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <div className="inline-block align-bottom bg-black rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                    <div className=" sm:block absolute top-0 right-0 pt-4 pr-4">
                      <button
                        type="button"
                        className="bg-black rounded-md text-om-200 hover:text-om-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-om-200"
                        onClick={() => handleCloseModal()}
                      >
                        <span className="sr-only">Close</span>
                        <XIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="sm:flex sm:items-start">
                      <div className="mt-6">
                        <div className="mt-3 mb-8 text-center sm:mt-0">
                          <Dialog.Title
                            as="h3"
                            className="text-lg leading-6 font-medium text-gray-900"
                          >
                            <p className="flex justify-center text-sm font-medium text-gray-300 mt-1">
                              Add Project Info
                            </p>
                          </Dialog.Title>
                          {error && (
                            <p className="flex justify-center text-sm font-medium text-red-500 mt-1">
                              {error}
                            </p>
                          )}
                        </div>
                        <div className="grid grid-cols-12 gap-y-6 gap-x-4">
                          <div className="col-span-full">
                            <label
                              htmlFor="email-address"
                              className="block text-sm font-medium text-gray-300"
                            >
                              Project Snippet Video Link
                            </label>
                            <div className="mt-1">
                              <input
                                value={inputVal.link}
                                onChange={handleChange}
                                type="text"
                                id="link"
                                name="link"
                                autoComplete="link"
                                className="appearance-none bg-transparent block w-full px-3 py-2 border border-om-200 rounded-md shadow-sm  focus:outline-none focus:ring-om-200 focus:border-om-200 sm:text-sm"
                              />
                            </div>
                          </div>

                          <div className="col-span-8 sm:col-span-9 mb-3">
                            <label
                              htmlFor="title"
                              className="block text-sm font-medium text-gray-300"
                            >
                              Project Title
                            </label>
                            <div className="mt-1">
                              <input
                                value={inputVal.title}
                                onChange={handleChange}
                                type="text"
                                id="title"
                                name="title"
                                autoComplete="title"
                                className="appearance-none bg-transparent block w-full px-3 py-2 border border-om-200 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-om-200 focus:border-om-200 sm:text-sm"
                              />
                            </div>
                          </div>

                          <div className="col-span-4 sm:col-span-3 mb-3">
                            <label
                              htmlFor="amount"
                              className="block text-sm font-medium text-gray-300"
                            >
                              Project Type
                            </label>
                            <div className="mt-1">
                              <input
                                value={inputVal.type}
                                onChange={handleChange}
                                type="text"
                                id="type"
                                name="type"
                                autoComplete="type"
                                className="appearance-none bg-transparent block w-full px-3 py-2 border border-om-200 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-om-200 focus:border-om-200 sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>

                        {loading ? (
                          <button
                            type="submit"
                            className="w-full mt-6  border border-om-200 rounded-md shadow-sm py-2 px-4 text-sm font-medium text-black bg-om-200 hover:text-om-200 hover:bg-transparent  focus:outline-none focus:ring-om-200 focus:border-om-200"
                          >
                            Loading...
                          </button>
                        ) : (
                          <button
                            type="submit"
                            onClick={handleSubmitProject}
                            className="w-full mt-6  border border-om-200 rounded-md shadow-sm py-2 px-4 text-sm font-medium text-black bg-om-200 hover:text-om-200 hover:bg-transparent  focus:outline-none focus:ring-om-200 focus:border-om-200"
                          >
                            Submit Project
                          </button>
                        )}

                        <p className="flex justify-center text-sm font-medium text-gray-500 mt-6">
                          <LockClosedIcon
                            className="w-5 h-5 text-gray-400 mr-1.5"
                            aria-hidden="true"
                          />
                          Powered by Omen
                        </p>
                      </div>
                    </div>
                  </div>
                </Transition.Child>
              </div>
            </Dialog>
          </Transition.Root>
        </div>
      </div>
    </div>
  );
};

export default Home;
