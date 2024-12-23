import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Loader2,
  Sparkles,
  Timer,
  ThumbsUp,
  ThumbsDown,
  Trophy,
  RefreshCcw,
  BookOpen,
} from "lucide-react";
import axios from "../api/axios";
import toast from "react-hot-toast";
import { Dialog, DialogContent } from "@mui/material";

const FactCheckingGame = () => {
  const [facts, setFacts] = useState(null);
  const [stage, setStage] = useState("nameInput");
  const [timer, setTimer] = useState(0);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState([]);
  const [score, setScore] = useState(0);
  const [difficulty, setDifficulty] = useState("medium");
  const [topic, setTopic] = useState("");
  const [participantName, setParticipantName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const fetchFacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/fact-check/challenge", {
        difficulty,
        topic,
      });

      const factsData = response.data.facts;
      setFacts(factsData);
      setStage("game");
      setTimer(30);
      setUserAnswers([]);
      setIsLoading(false);
    } catch (error) {
      toast.error("Failed to generate facts");
      setIsLoading(false);
    }
  }, [difficulty, topic]);

  useEffect(() => {
    if (stage === "game" && timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(countdown);
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdown);
    }
  }, [stage, timer]);

  const handleAnswer = (isTrue) => {
    const newAnswers = [
      ...userAnswers,
      {
        factIndex: currentFactIndex,
        userAnswer: isTrue,
        isCorrect: isTrue === facts.items[currentFactIndex].isTrue,
      },
    ];
    setUserAnswers(newAnswers);

    if (currentFactIndex < facts.items.length - 1) {
      setCurrentFactIndex((prev) => prev + 1);
      setTimer(30); // Reset timer for next fact
    } else {
      evaluateGame(newAnswers);
    }
  };

  const handleTimeUp = () => {
    if (currentFactIndex < facts.items.length - 1) {
      setCurrentFactIndex((prev) => prev + 1);
      setTimer(30);
    } else {
      evaluateGame(userAnswers);
    }
  };

  const evaluateGame = (answers) => {
    const correctAnswers = answers.filter((answer) => answer.isCorrect).length;
    const calculatedScore = Math.round(
      (correctAnswers / facts.items.length) * 100
    );
    setScore(calculatedScore);
    setStage("result");
  };

  const handleNameSubmit = () => {
    if (participantName.trim()) {
      setStage("setup");
    } else {
      toast.error("Please enter your name");
    }
  };

  const fullReset = () => {
    setFacts(null);
    setStage("nameInput");
    setTimer(0);
    setCurrentFactIndex(0);
    setUserAnswers([]);
    setScore(0);
    setDifficulty("medium");
    setTopic("");
    setParticipantName("");
    setIsLoading(false);
  };

  const renderContent = () => {
    switch (stage) {
      case "nameInput":
        return renderNameInputStage();
      case "setup":
        return renderSetupStage();
      case "game":
        return facts && renderGameStage();
      case "result":
        return renderResultStage();
      default:
        return null;
    }
  };

  const renderNameInputStage = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <Brain className="w-16 h-16 text-red-300 mx-auto" />
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Fact Checking Challenge
        </h1>
        <p className="text-red-200">Test your knowledge!</p>
      </div>

      <input
        type="text"
        value={participantName}
        onChange={(e) => setParticipantName(e.target.value)}
        placeholder="Enter your name"
        className="w-full px-4 py-2 md:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
      />

      <button
        onClick={handleNameSubmit}
        className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity"
      >
        Start Game
      </button>
    </motion.div>
  );

  const renderSetupStage = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <Brain className="w-16 h-16 text-red-300 mx-auto" />
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          Fact Checking Challenge
        </h1>
        <p className="text-red-200">Test your knowledge!</p>
      </div>

      <div className="space-y-4">
        <label className="text-white block">Select Difficulty:</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="w-full px-4 py-2 md:py-3 bg-white/10 border border-white/20 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          <option value="easy" className="bg-red-900">
            Easy
          </option>
          <option value="medium" className="bg-red-900">
            Medium
          </option>
          <option value="hard" className="bg-red-900">
            Hard
          </option>
        </select>

        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a topic (e.g., 'Space', 'History')"
          className="w-full px-4 py-2 md:py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
        />
      </div>

      <button
        onClick={fetchFacts}
        disabled={isLoading || !topic.trim()}
        className="w-full px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={20} />
            Generating Facts...
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <Sparkles size={20} />
            Start Challenge
          </div>
        )}
      </button>
    </motion.div>
  );

  const renderGameStage = () => (
    <div className="text-center space-y-4">
      <h2 className="text-xl md:text-2xl font-bold text-white flex items-center justify-center gap-2">
        <BookOpen size={24} /> Fact {currentFactIndex + 1} of{" "}
        {facts.items.length}
      </h2>

      <motion.div
        key={currentFactIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white/10 p-6 rounded-xl text-white text-lg"
      >
        {facts.items[currentFactIndex].statement}
      </motion.div>

      <div className="flex justify-center gap-4">
        <button
          onClick={() => handleAnswer(true)}
          className="flex items-center gap-2 px-6 py-3 bg-green-500/20 hover:bg-green-500/30 rounded-xl text-white"
        >
          <ThumbsUp size={20} /> True
        </button>
        <button
          onClick={() => handleAnswer(false)}
          className="flex items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 rounded-xl text-white"
        >
          <ThumbsDown size={20} /> False
        </button>
      </div>

      <p className="text-red-200 flex items-center justify-center gap-2">
        <Timer size={20} /> Time Remaining: {timer} seconds
      </p>
    </div>
  );

  const renderResultStage = () => (
    <div className="text-center space-y-4">
      <h2 className="text-2xl font-bold text-white">Challenge Complete</h2>
      <div className="flex justify-center items-center space-x-4">
        <Trophy className="w-16 h-16 text-yellow-400" />
        <div>
          <p className="text-xl text-white">Score: {score}%</p>
          <p className="text-red-200">Topic: {topic}</p>
          <p className="text-red-200">Difficulty: {difficulty.toUpperCase()}</p>
        </div>
      </div>
      <button
        onClick={fullReset}
        className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl text-white"
      >
        <RefreshCcw size={20} /> Play Again
      </button>
    </div>
  );

  return (
    <div
      className="flex items-center justify-center px-4 py-10 md:py-16"
      style={{ height: "calc(100vh - 6rem)" }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-4xl bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 shadow-xl"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default FactCheckingGame;
