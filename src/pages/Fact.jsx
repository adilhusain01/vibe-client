import { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { WalletContext } from "../context/WalletContext";
import toast from "react-hot-toast";
import axios from "../api/axios";
import { Dialog, DialogContent } from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import {
  Timer,
  ArrowRight,
  CheckCircle2,
  RefreshCcw,
  Trophy,
  Loader2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";

const FactCheckingGame = () => {
  const { id } = useParams();
  const { walletAddress, connectWallet } = useContext(WalletContext);
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState(null);
  const [gameCreator, setGameCreator] = useState("");
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [participantName, setParticipantName] = useState("");
  const [nameDialogOpen, setNameDialogOpen] = useState(true);
  const [timer, setTimer] = useState(30);
  const [userJoined, setUserJoined] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameEnded, setGameEnded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchGame = async () => {
      if (!walletAddress) {
        toast.error("Please connect your wallet first.");
        await connectWallet();
        return;
      }

      try {
        const response = await axios.post(
          `/api/fact-check/verify/${id}`,
          { walletAddress },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        setGame(response.data);
        setGameStarted(response.data.isPublic);
        setGameEnded(response.data.isFinished);
        setGameCreator(response.data.creatorName);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error);
        setMessage(err.response?.status === 404 ? "Game not found" : "");
        setLoading(false);
        toast.error(
          err.response?.data?.error ||
            "An error occurred while fetching the game."
        );
      }
    };

    fetchGame();
  }, [id, walletAddress, connectWallet]);

  // Timer effect
  useEffect(() => {
    let interval;
    if (gameStarted && !isSubmitting && !gameEnded && userJoined) {
      interval = setInterval(() => {
        setTimer((prevTimer) => {
          if (prevTimer <= 1) {
            handleNextFact();
            return 30;
          }
          return prevTimer - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStarted, currentFactIndex, isSubmitting, gameEnded, userJoined]);

  const handleAnswerChange = (factId, answer) => {
    if (isSubmitting || !userJoined) return;
    setAnswers({
      ...answers,
      [factId]: answer,
    });
  };

  const handleNextFact = () => {
    if (isSubmitting || !userJoined) return;

    const currentFact = game.facts[currentFactIndex];
    if (!answers[currentFact._id]) {
      setAnswers({
        ...answers,
        [currentFact._id]: "skipped",
      });
    }
    setTimer(30);

    if (currentFactIndex < game.facts.length - 1) {
      setCurrentFactIndex(currentFactIndex + 1);
    } else {
      handleSubmitGame();
    }
  };

  const handleJoinGame = async () => {
    try {
      await axios.post(
        `/api/fact-check/join/${id}`,
        {
          walletAddress,
          participantName,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Joined fact-checking game successfully!");
      setNameDialogOpen(false);
      setUserJoined(true);
      setTimer(30);
      setGameStarted(true);
    } catch (err) {
      toast.error(
        err.response?.data?.error || "An error occurred while joining the game."
      );
    }
  };

  const handleSubmitGame = async () => {
    setIsSubmitting(true);
    try {
      await axios.post(
        "/api/fact-check/submit",
        {
          gameId: id,
          walletAddress,
          answers,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      toast.success("Answers submitted successfully!");
      navigate(`/leaderboards/${id}`);
    } catch (err) {
      console.error(err);
      toast.error(
        err.response?.data?.error ||
          "An error occurred while submitting answers."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNameSubmit = () => {
    if (!participantName) {
      toast.error("Please enter your name.");
      return;
    }
    handleJoinGame();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <Loader2 className="w-6 md:w-8 h-6 md:h-8 text-red-400 animate-spin" />
      </div>
    );
  }

  if (gameEnded) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <div className="text-center space-y-4">
          <Trophy className="w-12 md:w-16 h-12 md:h-16 text-red-400 mx-auto" />
          <h1 className="text-2xl md:text-4xl font-bold text-white">
            Game has ended
          </h1>
          <p className="text-red-200">
            Check the leaderboard to see the results
          </p>
        </div>
      </div>
    );
  }

  if (!gameStarted) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-6rem)]">
        <div className="text-center flex flex-col items-center justify-center space-y-6">
          <h1 className="text-2xl md:text-4xl font-bold text-white">
            {message || "Game hasn't started yet"}
          </h1>
          <p className="text-md md:text-lg text-red-200">
            {message ? "" : "Please wait for the game to begin"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-md md:text-lg flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
          >
            <RefreshCcw size={20} />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const currentFact = game?.facts[currentFactIndex];

  return (
    <div className="flex items-center justify-center px-4 h-[calc(100vh-6rem)]">
      <Dialog
        open={nameDialogOpen}
        PaperProps={{
          style: {
            backgroundColor: "#7f1d1d",
            borderRadius: "1rem",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            maxWidth: "400px",
            width: "100%",
          },
        }}
      >
        <DialogContent className="space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-white text-center">
            Welcome to the Fact Checking Game
          </h2>
          <p className="text-md md:text-lg text-red-200 text-center">
            Please enter your name to begin
          </p>
          <input
            type="text"
            value={participantName}
            onChange={(e) => setParticipantName(e.target.value)}
            placeholder="Enter your name"
            className="w-full px-4 py-2 md:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            onClick={handleNameSubmit}
            className="w-full px-6 py-2 md:py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
          >
            Start Game
          </button>
        </DialogContent>
      </Dialog>

      {userJoined && (
        <div className="w-full max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentFactIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl space-y-6"
            >
              {!isSubmitting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-red-200">
                      Fact {currentFactIndex + 1} of {game?.facts?.length}
                    </span>
                    <div className="flex items-center gap-2 text-white">
                      <Timer size={20} className="text-red-400" />
                      <span className="font-medium">{timer}s</span>
                    </div>
                  </div>
                  <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: `${(timer / 30) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                      className="absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-pink-500"
                    />
                  </div>
                </div>
              )}

              {isSubmitting ? (
                <div className="flex flex-col items-center justify-center py-8 space-y-4">
                  <Loader2 className="w-12 h-12 text-red-400 animate-spin" />
                  <p className="text-white text-xl font-medium">
                    Submitting Answers...
                  </p>
                  <p className="text-red-200 text-center">
                    Please wait while we process your submission
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-4">
                    <h2 className="text-lg md:text-2xl font-bold text-white">
                      {currentFact.statement}
                    </h2>
                    <p className="text-red-200">
                      Is this statement true or false?
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <motion.button
                      onClick={() =>
                        handleAnswerChange(currentFact._id, "true")
                      }
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                        answers[currentFact._id] === "true"
                          ? "bg-red-500/20 border-red-400"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ThumbsUp size={24} className="text-green-400" />
                      <span className="text-white font-medium">True</span>
                    </motion.button>

                    <motion.button
                      onClick={() =>
                        handleAnswerChange(currentFact._id, "false")
                      }
                      className={`flex items-center justify-center gap-2 p-4 rounded-xl border transition-all ${
                        answers[currentFact._id] === "false"
                          ? "bg-red-500/20 border-red-400"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ThumbsDown size={24} className="text-red-400" />
                      <span className="text-white font-medium">False</span>
                    </motion.button>
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleNextFact}
                      disabled={!answers[currentFact._id]}
                      className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-medium transition-all ${
                        answers[currentFact._id]
                          ? "bg-gradient-to-r from-red-500 to-pink-500 text-white hover:opacity-90"
                          : "bg-white/10 text-white/50 cursor-not-allowed"
                      }`}
                    >
                      {currentFactIndex < game.facts.length - 1
                        ? "Next Fact"
                        : "Submit Answers"}
                      <ArrowRight size={20} />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default FactCheckingGame;
