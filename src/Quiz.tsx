import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { FaMale } from 'react-icons/fa';
import { FaFemale } from 'react-icons/fa';
import { FaCar } from 'react-icons/fa';
import { MdPedalBike } from 'react-icons/md';
import { IoIosArrowRoundBack } from 'react-icons/io';
import { useIsMount } from './useIsMount';
import './index.css';


interface AdditionalOptions {
  hideNextButton?: boolean;
}

interface QuestionBlock {
  id: number;
  question: string;
  type: 'select-sex' | 'single-variant' | 'custom-input' | 'select-vehicle-type';
  options?: Array<string | boolean>;
  additionalOptions?: AdditionalOptions;
  conditionalBlocks?: ConditionalBlock;
}

interface ConditionalBlock {
  [key: string]: QuestionBlock[];
}

interface FormData {
  [key: string]: any;
}

interface Nesting {
  [key: string]: {
    id: string;
    position: number;
    active: boolean;
  };
}

const App: React.FC = () => {
  const isMount = useIsMount();
  const [steps, setSteps] = useState<QuestionBlock[]>([]);
  const [isNextDisabled, setIsNextDisabled] = useState<boolean>(true);
  const [nesting, setNesting] = useState<Nesting>({});
  const [formData, setFormData] = useState<FormData>({});
  const [formTime, setFormTime] = useState<{ [key: string]: number }>({});
  const [questionsCount, setQuestionsCount] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const [currentStep, setCurrentStep] = useState<QuestionBlock | null>(null);
  const [currentStepNumber, setCurrentStepNumber] = useState(0);
  const [history, setHistory] = useState<(QuestionBlock | null)[]>([]);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [isLastQuestion, setIsLastQuestion] = useState<boolean>(false);
  const [stepStartTime, setStepStartTime] = useState<Date>(new Date());
  const [totalTime, setTotalTime] = useState<Number>(0);

  const { register, setValue, getValues, reset, watch } = useForm<FormData>();

  useEffect(() => {
    if (questionsCount === currentQuestionNumber) {
      setIsLastQuestion(true);
    } else {
      setIsLastQuestion(false);
    }
  }, [questionsCount, currentQuestionNumber]);

  // Load initial data (JSON), form data, and time from localStorage if available
  useEffect(() => {
    fetch('./questions.json')
      .then((res) => res.json())
      .then((data) => {
        setSteps(data);
        setStepStartTime(new Date());
        loadAllData(data);
      });
  }, []);

  useEffect(() => {
    if (!isMount) {
      saveAllData();
    }
  }, [history, isFinished]);

  useEffect(() => {
    console.log('CurrentStepNumber', currentStepNumber);
  }, [currentStepNumber]);


  useEffect(() => {
    calculateCount(steps, nesting);
  }, [JSON.stringify(nesting)]);

  const findElementById = (elements: QuestionBlock[], id: string): QuestionBlock | null => {
    // Base case: Loop through the main array of elements
    for (const element of elements) {
      // Check if the current element has the matching id
      if (element.id === +id) {
        return element;
      }

      // Recursively check the 'conditionalBlocks' if it exists
      if (element.conditionalBlocks) {
        for (const key in element.conditionalBlocks) {
          const found = findElementById(element.conditionalBlocks[key], id);
          if (found) {
            return found;
          }
        }
      }
    }

    // Return null if no matching element is found
    return null;
  };

  /**
   * Saves the state and data to localStorage
   */
  const saveAllData = () => {
    return;
    localStorage.setItem('nesting', JSON.stringify(nesting));
    localStorage.setItem('formData', JSON.stringify(formData));
    localStorage.setItem('questionsCount', JSON.stringify(questionsCount));
    localStorage.setItem('currentQuestionNumber', JSON.stringify(currentQuestionNumber));
    localStorage.setItem('currentStep', JSON.stringify(currentStep));
    localStorage.setItem('currentStepNumber', JSON.stringify(currentStepNumber));
    localStorage.setItem('history', JSON.stringify(history));
    localStorage.setItem('formTime', JSON.stringify(formTime));
    localStorage.setItem('isFinished', JSON.stringify(isFinished));
  };

  const restart = () => {
    localStorage.removeItem('nesting');
    localStorage.removeItem('formData');
    localStorage.removeItem('questionsCount');
    localStorage.removeItem('currentQuestionNumber');
    localStorage.removeItem('currentStep');
    localStorage.removeItem('currentStepNumber');
    localStorage.removeItem('history');
    localStorage.removeItem('formTime');
    localStorage.removeItem('isFinished');

    setIsNextDisabled(true);
    setNesting({});
    setFormData({});
    setQuestionsCount(0);
    setCurrentQuestionNumber(1);
    setCurrentStepNumber(0);
    setHistory([]);
    setIsFinished(false);
    setIsLastQuestion(false);
    calculateCount(steps, {});
    setCurrentStep(steps[0]);
    setStepStartTime(new Date());
    setFormTime({});
  };

  /**
   * Loads initial data (JSON), form data, and time from localStorage if available.
   *
   * @param data The questions data.
   */
  const loadAllData = (data: QuestionBlock[]) => {
    const parsedNesting = JSON.parse(localStorage.getItem('nesting') || '{}');
    if (Object.keys(parsedNesting).length > 0) {
      setNesting(parsedNesting);
    }
    calculateCount(data, parsedNesting);

    const parsedFormData = JSON.parse(localStorage.getItem('formData') || 'null');
    if (parsedFormData) {
      setFormData(parsedFormData);
    }

    const parsedCurrentQuestionNumber = JSON.parse(localStorage.getItem('currentQuestionNumber') || 'null');
    if (parsedCurrentQuestionNumber) {
      setCurrentQuestionNumber(parsedCurrentQuestionNumber);
    }

    const parsedCurrentStepNumber = JSON.parse(localStorage.getItem('currentStepNumber') || 'null');
    if (parsedCurrentStepNumber !== null) {
      setCurrentStepNumber(parsedCurrentStepNumber);
    }

    const parsedHistory = JSON.parse(localStorage.getItem('history') || 'null');
    if (parsedHistory) {
      setHistory(parsedHistory);
    }

    const parsedTime = JSON.parse(localStorage.getItem('formTime') || 'null');
    if (parsedTime) {
      setFormTime(parsedTime);
      calculateTotalTime(parsedTime);
    }

    const parsedCurrentStep = JSON.parse(localStorage.getItem('currentStep') || 'null');
    if (parsedCurrentStep) {
      setCurrentStep(parsedCurrentStep);
    } else {
      if (data && data.length > 0) {
        setCurrentStep(data[0]);
      }
    }

    const parsedIsFinished = JSON.parse(localStorage.getItem('isFinished') || 'null');
    if (parsedIsFinished !== null) {
      setIsFinished(parsedIsFinished);
    }
  };

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      // no need for any action if it's a reset action
      if (Object.keys(value).length === 0) {
        return;
      }

      if (currentStep) {
        switch (currentStep.type) {
          case 'single-variant':
            setIsNextDisabled(false);
            break;
          case 'custom-input':
            if (name && name in value && value[name].length === 0) {
              setIsNextDisabled(true);
            } else {
              setIsNextDisabled(false);
            }
            break;
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, steps, currentStep]);

  /**
   * Finds the last active nesting object in the nesting state.
   *
   * @param data The nesting state.
   * @returns The last active nesting object, or null if none is found.
   */
  const findLastActive = (data: Nesting): Nesting | null => {
    let lastActive = null;
    Object.values(data).forEach((item) => {
      if (item.active === true) {
        lastActive = item;
      }
    });

    return lastActive as Nesting | null;
  };

  const hasActiveNesting = (data: Nesting) => {
    return Object.values(data).some((item) => item.active === true);
  };

  const calculateCount = (data: QuestionBlock[], localNesting: Nesting) => {
    let normalCount = data.length;
    let additionalCount = 0;

    if (Object.keys(localNesting).length > 0) {
      for (const i in localNesting) {
        let element = findElementById(data, localNesting[i].id);

        for (const j in formData) {
          if (element && element.conditionalBlocks && j === element.question) {
            additionalCount += element.conditionalBlocks[formData[j]].length;
          }
        }
      }
    }

    setQuestionsCount(normalCount + additionalCount);
  };

  const calculateTotalTime = (data?: { [key: string]: number }) => {
    let total = 0;
    let from = data ? data : formTime;

    for (const i in from) {
      total += from[i];
    }
    setTotalTime(total);
  };

  const handleNextButton = (e: React.SyntheticEvent) => {
    e.preventDefault();
    handleStep();
  };

  /**
   * Handles the nesting of questions. If the user goes back in history
   * and answers a question that has a conditional block, this function
   * will be called to update the current step and the nesting state.
   *
   * @returns true if the user should be taken to the next step, false otherwise.
   */
  const handleNesting = (formData: { [key: string]: string }) => {
    const lastActive = findLastActive(nesting) as Nesting;
    const parent = findElementById(steps, String(lastActive.id));

    if (parent === null) {
      return false;
    }

    const answerValue = formData[parent.question];
    console.log('handleNesting parent', parent, 'nesting[parent.id]', nesting[parent.id]);

    // if conditional questions number is more than we have nesting, we're done
    if (
      parent &&
      parent.conditionalBlocks &&
      parent.conditionalBlocks[answerValue].length - 1 > nesting[parent.id].position
    ) {
      console.log('position++');
      nesting[parent.id].position++;
      setNesting(nesting);
      setCurrentStep(parent.conditionalBlocks[answerValue][nesting[parent.id].position]);
      setCurrentQuestionNumber(currentQuestionNumber + 1);
    } else {
      console.log('active=false');
      nesting[parent.id].active = false;
      setNesting(nesting);
      if (hasActiveNesting(nesting)) {
        handleNesting(formData);
      } else {
        goToNextStep();
      }
    }
  };

  const handleStep = function () {
    let savedFormData = { ...formData, ...getValues() };
    setFormData(savedFormData);
    // reset form, because we stored answers in formData
    reset();

    if (currentStep) {
      const timeSpent = { [currentStep.question]: new Date().getTime() - stepStartTime.getTime() };
      setFormTime({ ...formTime, ...timeSpent });
      setStepStartTime(new Date());
    }

    if (isLastQuestion) {
      setIsFinished(true);
      calculateTotalTime();
      return;
    }

    setIsNextDisabled(true);

    // save history
    setHistory((prevSteps) => [...prevSteps, currentStep]);

    if (hasActiveNesting(nesting)) {
      if (currentStep?.conditionalBlocks) {
        const block = currentStep.conditionalBlocks[savedFormData[currentStep.question]];

        if (block) {
          setCurrentStep(block[0]);
          setCurrentQuestionNumber(currentQuestionNumber + 1);
          setNesting((data) => ({
            ...data,
            [currentStep.id]: { id: currentStep.id, position: 0, active: true },
          }));
          return;
        }
      }

      handleNesting(savedFormData);
      return;
    }

    if (currentStep?.conditionalBlocks) {
      const block = currentStep.conditionalBlocks[savedFormData[currentStep.question]];

      if (block) {
        setCurrentStep(block[0]);
        setCurrentQuestionNumber(currentQuestionNumber + 1);
        setNesting((data) => ({
          ...data,
          [currentStep.id]: { id: currentStep.id, position: 0, active: true },
        }));
      } else {
        goToNextStep();
      }
    } else {
      goToNextStep();
    }
  };

  const goToNextStep = () => {
    const nextQuestionNumber = currentStepNumber + 1;
    setCurrentStepNumber(nextQuestionNumber);
    setCurrentStep(steps[nextQuestionNumber]);
    setCurrentQuestionNumber(currentQuestionNumber + 1);
  };

  const goBack = (e: React.SyntheticEvent) => {
    e.preventDefault();
    let currentNumber = currentStepNumber;
    let noDecrement = false;

    setIsLastQuestion(false);
    setStepStartTime(new Date());

    // take previous step from history
    const previousStep: QuestionBlock = history.slice(-1)[0]!;

    // reset form as we're going back in history
    reset();

    // Clear answer for the current question
    if (currentStep) {
      delete formData[currentStep.question];
      setFormData(formData);
    }

    // previous question is on 0-level or is nested in conditional block
    let previousInNesting = true;
    for (const i in steps) {
      if (previousStep && +steps[i].id === +previousStep.id) {
        previousInNesting = false;
        break;
      }
    }

    // if we're going back to question that has conditional blocks - remove it's nesting at all
    for (const i in nesting) {
      if (previousStep && +nesting[i].id === +previousStep.id) {
        console.log('deleting nesting[i], no decrement', nesting[i]);
        delete nesting[i];

        // we're going up in tree from nesting to general question
        noDecrement = true;
        break;
      }
    }

    // If nesting is present
    if (previousInNesting && Object.keys(nesting).length > 0) {
      console.log('previous in nesting');
      console.table(nesting);
      let lastEntry;

      // get last element of nesting
      for (const [key] of Object.entries(nesting)) {
        lastEntry = nesting[key];
      }

      if (lastEntry && lastEntry.active === true) {
        console.log('lastEntry active', lastEntry);
        if (lastEntry.position === 0) {
          delete nesting[lastEntry.id];
          console.log('DELETING NESTING', lastEntry.id);
          let newLastEntry;

          // if we're going from nesting up to another nesting
          for (const [key] of Object.entries(nesting)) {
            newLastEntry = nesting[key];
          }

          if (newLastEntry) {
            if (newLastEntry.active === false) {
              newLastEntry.active = true;
            } else {
              newLastEntry.position -= 1;
            }

            nesting[newLastEntry.id] = newLastEntry;
          }
        } else {
          if (noDecrement === false) {
            nesting[lastEntry.id].position -= 1;
            console.log('decrement position -1');
          }
        }

        setNesting(nesting);
      } else if (lastEntry && lastEntry.active === false) {
        console.log('lastEntry NOT active', lastEntry);

        const lastActiveNesting = findLastActive(nesting) as any;
        if (lastActiveNesting && lastActiveNesting.position) {
          console.log('lastActiveNesting position -1', lastActiveNesting);
          lastActiveNesting.position -= 1;
        } else {
          console.log('decrementing current step');
          currentNumber -= 1;
          setCurrentStepNumber(currentNumber);
        }

        nesting[lastEntry.id].active = true;
        setNesting(nesting);
      }
    } else if (noDecrement === false) {
      console.log('GOING BACK -1');
      currentNumber -= 1;
      setCurrentStepNumber(currentNumber);
    }

    // setting form value to previous step stored data
    if (previousStep) {
      setValue(previousStep.question, formData[previousStep.question]);
    }
    setCurrentStep(previousStep);
    setHistory(history.slice(0, -1));
    setCurrentQuestionNumber(currentQuestionNumber - 1);
  };

  return (
    <>
      <header></header>
      <div className="flex justify-center mt-6">
        {steps.length > 0 && (
          <>
            {isFinished ? (
              <div className="bg-white p-10 py-6 shadow-md w-full max-w-lg relative">
                <div className="flex justify-center w-full mb-10">
                  <span className="text-lg text-gray-600 font-semibold">Goals</span>
                </div>
                <div className="progress-bar">
                  <div className="progress w-full"></div>
                </div>

                <h1 className="text-xl font-bold mb-4 mt-8 text-center question">Quiz is finished</h1>
                <div className="results">
                  <div className="mb-2 text-gray-800 grid grid-cols-[260px_100px_100px] gap-2">
                    <span className="font-bold text-gray-900">Question</span>
                    <span className="font-bold text-gray-900">Answer</span>
                    <span className="font-bold text-gray-900">Time spent</span>
                  </div>
                  {Object.keys(formData).map((item, index) => (
                    <div key={index} className="border-b-2 border-b-stone-600 grid grid-cols-[260px_100px_100px] gap-2">
                      {item}
                      <span className="font-semibold"> {formData[item]}</span>
                      <span className="font-semibold"> {(formTime[item] / 1000).toFixed(1)}s</span>
                    </div>
                  ))}
                  <div className="mt-4 font-bold text-gray-800">
                    Total time spent: {(Number(totalTime) / 1000).toFixed(1)}s
                  </div>
                </div>
                <button
                  className="w-full mt-6 bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition-colors disabled:bg-slate-400"
                  onClick={restart}
                >
                  Restart quiz
                </button>
              </div>
            ) : (
              <form className="bg-white p-10 py-6 shadow-md w-full max-w-lg relative">
                <div className="flex justify-between w-full mb-10">
                  <div className="inline w-16">
                    {history.length > 0 && (
                      <button
                        className="flex items-center px-2 bg-white text-gray-600 rounded-lg shadow hover:bg-gray-100 transition-colors"
                        onClick={goBack}
                      >
                        <IoIosArrowRoundBack /> Back
                      </button>
                    )}
                  </div>
                  <span className="text-lg -ml-20 text-gray-600 font-semibold">Goals</span>
                  <span className="text-sm text-gray-600 font-semibold">
                    {currentQuestionNumber}/{questionsCount}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress"
                    style={{
                      width: `${((currentQuestionNumber - 1) / (questionsCount - 1)) * 95}%`,
                      borderTopRightRadius: currentQuestionNumber === questionsCount ? '5px' : '0px',
                      borderBottomRightRadius: currentQuestionNumber === questionsCount ? '5px' : '0px',
                    }}
                  ></div>
                </div>

                <h1 className="text-xl font-bold mb-4 mt-8 text-center question">{currentStep?.question}</h1>

                {currentStep?.type === 'custom-input' && (
                  <input
                    {...register(currentStep.question)}
                    type="text"
                    placeholder="Enter answer here"
                    className="w-full p-2 border rounded-md border-slate-300 mb-2"
                  />
                )}

                {currentStep?.type === 'single-variant' && (
                  <>
                    {currentStep.options?.length ? (
                      currentStep.options.map((option, index) => (
                        <label
                          key={index}
                          className="block mb-4 p-4 shadow-sm bg-white rounded-lg cursor-pointer"
                          htmlFor={String(option)}
                        >
                          <input
                            {...register(currentStep.question)}
                            type="radio"
                            value={String(option)}
                            id={String(option)}
                          />
                          <span className="text-slate-700 font-bold ml-2">{option}</span>
                        </label>
                      ))
                    ) : (
                      <>
                        <label
                          className="block mb-4 p-4 shadow-sm bg-white rounded-lg cursor-pointer"
                          htmlFor={`${currentStep.id}-true`}
                        >
                          <input
                            {...register(currentStep.question)}
                            type="radio"
                            value={'true'}
                            id={`${currentStep.id}-true`}
                          />
                          <span className="text-slate-700 font-bold ml-2">Yes</span>
                        </label>
                        <label
                          className="block mb-4 p-4 shadow-sm bg-white rounded-lg cursor-pointer"
                          htmlFor={`${currentStep.id}-false`}
                        >
                          <input
                            {...register(currentStep.question)}
                            type="radio"
                            value={'false'}
                            id={`${currentStep.id}-false`}
                          />
                          <span className="text-slate-700 font-bold ml-2">No</span>
                        </label>
                      </>
                    )}
                  </>
                )}

                {currentStep?.type === 'select-sex' && (
                  <>
                    <label
                      className={
                        'inline-block w-1/2 text-center text-9xl text-indigo-500 hover:text-indigo-600 cursor-pointer py-4' +
                        (formData[currentStep.question] === 'male' ? ' border-2 border-indigo-500' : '')
                      }
                      htmlFor="male"
                      onClick={() => {
                        setValue(currentStep.question, 'male');
                        handleStep();
                      }}
                    >
                      <input
                        {...register(currentStep.question)}
                        type="radio"
                        value="male"
                        id="male"
                        className="invisible"
                      />
                      <FaMale className="inline" />
                    </label>
                    <label
                      className={
                        'inline-block w-1/2 text-center text-9xl text-pink-500 hover:text-pink-600 cursor-pointer py-4' +
                        (formData[currentStep.question] === 'female' ? ' border-2 border-pink-500' : '')
                      }
                      htmlFor="female"
                      onClick={() => {
                        setValue(currentStep.question, 'female');
                        handleStep();
                      }}
                    >
                      <input
                        {...register(currentStep.question)}
                        type="radio"
                        value="female"
                        id="female"
                        className="invisible"
                      />
                      <FaFemale className="inline" />
                    </label>
                  </>
                )}

                {currentStep?.type === 'select-vehicle-type' && (
                  <>
                    <label
                      className={
                        'inline-block w-1/2 text-center text-9xl text-indigo-500 hover:text-indigo-600 cursor-pointer py-4' +
                        (formData[currentStep.question] === 'car' ? ' border-2 border-indigo-500' : '')
                      }
                      htmlFor="car"
                      onClick={() => {
                        setValue(currentStep.question, 'car');
                        handleStep();
                      }}
                    >
                      <input
                        {...register(currentStep.question)}
                        type="radio"
                        value="car"
                        id="car"
                        className="invisible"
                      />
                      <FaCar className="inline" />
                    </label>
                    <label
                      className={
                        'inline-block w-1/2 text-center text-9xl text-yellow-500 hover:text-yellow-600 cursor-pointer py-4' +
                        (formData[currentStep.question] === 'bike' ? ' border-2 border-yellow-500' : '')
                      }
                      htmlFor="bike"
                      onClick={() => {
                        setValue(currentStep.question, 'bike');
                        handleStep();
                      }}
                    >
                      <input
                        {...register(currentStep.question)}
                        type="radio"
                        value="bike"
                        id="bike"
                        className="invisible"
                      />
                      <MdPedalBike className="inline" />
                    </label>
                  </>
                )}

                {!currentStep?.additionalOptions?.hideNextButton && (
                  <button
                    className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition-colors disabled:bg-slate-400"
                    onClick={handleNextButton}
                    disabled={isNextDisabled}
                  >
                    {isLastQuestion ? 'Submit' : 'Next'}
                  </button>
                )}
              </form>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default App;
