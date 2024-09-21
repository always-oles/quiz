import { useState, useRef, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { FaMale } from 'react-icons/fa';
import { FaFemale } from 'react-icons/fa';
import { FaCar } from 'react-icons/fa';
import { MdPedalBike } from 'react-icons/md';
import { IoIosArrowRoundBack } from 'react-icons/io';

interface QuestionBlock {
  id: number;
  question: string;
  type:
    | 'select-sex'
    | 'single-variant'
    | 'custom-input'
    | 'select-vehicle-type';
  options?: Array<string | boolean>;
  additionalOptions?: AdditionalOptions;
  conditionalBlocks?: ConditionalBlock;
}

interface AdditionalOptions {
  hideNextButton?: boolean;
}

interface ConditionalBlock {
  [key: string]: QuestionBlock[];
}

interface FormData {
  [key: string]: any;
}

const App: React.FC = () => {
  const lastStep = useRef();
  const [steps, setSteps] = useState<QuestionBlock[]>([]);

  const [moreQuestions, setMoreQuestions] = useState([]);
  const [nesting, setNesting] = useState({});
  const [formData, setFormData] = useState({});

  const [currentStep, setCurrentStep] = useState<QuestionBlock | null>(null);
  const [currentStepNumber, setCurrentStepNumber] = useState(0);

  const [history, setHistory] = useState([]);
  const [timeSpent, setTimeSpent] = useState<number[]>([]);
  const [stepStartTime, setStepStartTime] = useState<Date>(new Date());
  const { register, handleSubmit, setValue, getValues, reset, watch } =
    useForm<FormData>();
  const watchAllFields = watch();

  function findElementById(elements, id) {
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
  }

  // Load initial data (JSON), form data, and time from localStorage if available
  useEffect(() => {
    fetch('./questions.json')
      .then((res) => res.json())
      .then((data) => {
        setSteps(data);
        setCurrentStep(data[0]);
        lastStep.current = data[data.length - 1];
        // const savedData = JSON.parse(localStorage.getItem('formData') || '{}');
        const savedTime = JSON.parse(localStorage.getItem('timeSpent') || '[]');

        setTimeSpent(
          savedTime.length ? savedTime : new Array(data.length).fill(0)
        );
        setStepStartTime(new Date());
      });
  }, []);

  // useEffect(() => {
  //   const subscription = watch((value, { name, type }) => {
  //     console.log('watch! CHANGED', value, name, type);
  //   });
  //   return () => subscription.unsubscribe();
  // }, [watch, steps, currentStep]);

  const handleNextButton = (e: React.SyntheticEvent) => {
    e.preventDefault();
    handleStep();
  };

  useEffect(() => {
    console.log('history----->', history);
  }, [history]);

  /**
   * Handles the nesting of questions. If the user goes back in history
   * and answers a question that has a conditional block, this function
   * will be called to update the current step and the nesting state.
   *
   * @returns true if the user should be taken to the next step, false otherwise.
   */
  function handleNesting(formData) {
    const parent = findElementById(
      steps,
      Object.keys(nesting)[Object.keys(nesting).length - 1]
    );

    if (parent === null) {
      return true;
    }

    for (const [key, value] of Object.entries(formData)) {
      if (parent.question === key) {
        if (parent.conditionalBlocks[value].length - 1 > nesting[parent.id]) {
          let newNesting = nesting;
          newNesting[parent.id]++;
          setNesting(newNesting);
          setCurrentStep(
            parent.conditionalBlocks[value][newNesting[parent.id]]
          );
          return true;
        } else {
          let newNesting = nesting;
          delete newNesting[parent.id];
          setNesting(newNesting);
          if (Object.keys(newNesting).length > 0) {
            handleNesting(formData);
          } else {
            goToNextStep();
          }
          return false;
        }
      }
    }
  }

  const handleStep = function () {
    console.log(
      'HANDLE STEP! CurrentStep:',
      currentStep,
      'getValues',
      getValues()
    );

    let savedFormData = { ...formData, ...getValues() };
    setFormData(savedFormData);
    reset();
    console.log('saved form data', savedFormData);


    if (currentStep.id === lastStep.current.id) {
      alert('last step completed!');
      return;
    }

    // save history
    // TODO: save time spent and chosen option in currentstep
    setHistory((prevSteps) => [...prevSteps, currentStep]);

    if (Object.keys(nesting).length > 0) {
      console.log('nesting detected', nesting);

      if (currentStep?.conditionalBlocks) {
        const block =
          currentStep.conditionalBlocks[savedFormData[currentStep.question]];

        if (block) {
          setCurrentStep(block[0]);
          setNesting((data) => ({ ...data, [currentStep.id]: 0 }));
          return;
        }
      }

      let result;
      do {
        result = handleNesting(savedFormData);
      } while (result === false);
      return;
    }

    // TODO replace .question with ids
    if (currentStep?.conditionalBlocks) {
      const block =
        currentStep.conditionalBlocks[savedFormData[currentStep.question]];

      if (block) {
        setCurrentStep(block[0]);
        setNesting((data) => ({ ...data, [currentStep.id]: 0 }));
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
    console.log('NNNext question');
  };

  const goBack = (e: React.SyntheticEvent) => {
    e.preventDefault();

    console.log('going back in history, setting step', history.slice(-1)[0]);
    setCurrentStep(history.slice(-1)[0]);
    setHistory(history.slice(0, -1));
  };

  return (
    <div className="flex justify-center items-center h-screen">
      {steps.length > 0 && (
        <>
          <form className="bg-slate-50 p-12 rounded-lg shadow-lg w-full max-w-lg relative">
            {history.length > 0 && (
              <button
                className="absolute top-2 left-2 flex items-center px-2 bg-white text-gray-600 rounded-lg shadow hover:bg-gray-100 transition-colors"
                onClick={goBack}
              >
                <IoIosArrowRoundBack /> Back
              </button>
            )}
            <h1 className="text-xl font-bold mb-4 mt-2 text-center">
              {currentStep?.question}
            </h1>

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
                      htmlFor={option}
                    >
                      <input
                        {...register(currentStep.question)}
                        type="radio"
                        value={option}
                        id={option}
                      />
                      <span className="text-slate-700 font-bold ml-2">
                        {option}
                      </span>
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
                  className="inline-block w-1/2 text-center text-9xl text-indigo-500 hover:text-indigo-600 cursor-pointer"
                  htmlFor="male"
                  onClick={() => {
                    setValue(currentStep.question, 'male');
                    handleStep(currentStep.question, 'male');
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
                  className="inline-block w-1/2 text-center text-9xl text-pink-500 hover:text-pink-600 cursor-pointer"
                  htmlFor="female"
                  onClick={() => {
                    setValue(currentStep.question, 'female');
                    handleStep(currentStep.question, 'female');
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
                  className="inline-block w-1/2 text-center text-9xl text-indigo-500 hover:text-indigo-600 cursor-pointer"
                  htmlFor="car"
                  onClick={() => {
                    setValue('select-vehicle-type', 'car');
                    handleStep('select-vehicle-type', 'car');
                  }}
                >
                  <input
                    {...register('select-vehicle-type')}
                    type="radio"
                    value="car"
                    id="car"
                    className="invisible"
                  />
                  <FaCar className="inline" />
                </label>
                <label
                  className="inline-block w-1/2 text-center text-9xl text-zinc-500 hover:text-zinc-600 cursor-pointer"
                  htmlFor="bike"
                  onClick={() => {
                    setValue('select-vehicle-type', 'bike');
                    handleStep('select-vehicle-type', 'bike');
                  }}
                >
                  <input
                    {...register('select-vehicle-type')}
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
                className="w-full bg-indigo-500 text-white py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                onClick={handleNextButton}
              >
                Next
              </button>
            )}
          </form>
        </>
      )}
    </div>
  );
};

export default App;
