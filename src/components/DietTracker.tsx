import { useState, useRef } from 'react';
import { Plus, Trash2, TrendingUp, Camera, X, Calendar, Clock, BookOpen, Settings, Upload } from 'lucide-react';
import { Meal, PlannedMeal, Recipe, DailyGoals, NutritionTotals, AnalyzedNutrition } from '../types';
import { defaultRecipes } from '../data/recipes';
import { ProgressBar } from './ProgressBar';

export default function DietTracker() {
  const [activeTab, setActiveTab] = useState<'today' | 'plan' | 'recipes'>('today');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>(defaultRecipes);
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [selectedDay, setSelectedDay] = useState('Monday');
  const [mealTime, setMealTime] = useState('');
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [dailyGoals, setDailyGoals] = useState<DailyGoals>({
    calories: 2000,
    protein: 150,
    carbs: 250,
    fats: 65
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [showRecipeCamera, setShowRecipeCamera] = useState(false);
  const [recipeCapturedImage, setRecipeCapturedImage] = useState<string | null>(null);
  const [analyzingRecipe, setAnalyzingRecipe] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch {
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setShowRecipeCamera(false);
    setCapturedImage(null);
  };

  const startRecipeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowRecipeCamera(true);
    } catch {
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const captureRecipePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');
    setRecipeCapturedImage(imageData);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowRecipeCamera(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setRecipeCapturedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const analyzeRecipeImage = async () => {
    if (!recipeCapturedImage) return;
    
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      alert('Please set your VITE_ANTHROPIC_API_KEY in the .env file');
      return;
    }
    
    setAnalyzingRecipe(true);
    try {
      const base64Data = recipeCapturedImage.split(',')[1];
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: 'Analyze this food/recipe image. If it\'s a recipe card or document, extract the recipe details. If it\'s a photo of food, identify it and estimate the recipe. Respond ONLY with a JSON object (no markdown, no backticks, no preamble) in this exact format: {"name": "recipe name", "calories": number, "protein": number, "carbs": number, "fats": number, "recipe": "ingredients and instructions as a string with newlines"}. Estimate nutritional values for a typical serving.'
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content.map((item: { type: string; text?: string }) => 
        item.type === 'text' ? item.text : ''
      ).join('');
      const cleanText = text.replace(/```json|```/g, '').trim();
      const recipeData = JSON.parse(cleanText);
      
      const newRecipe: Recipe = {
        id: Date.now(),
        name: recipeData.name,
        calories: recipeData.calories,
        protein: recipeData.protein,
        carbs: recipeData.carbs,
        fats: recipeData.fats,
        recipe: recipeData.recipe
      };
      
      setSavedRecipes([...savedRecipes, newRecipe]);
      setRecipeCapturedImage(null);
      alert(`Recipe "${recipeData.name}" added successfully!`);
    } catch (err) {
      alert('Error analyzing image. Please try again.');
      console.error('Analysis error:', err);
    } finally {
      setAnalyzingRecipe(false);
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL('image/jpeg');
    setCapturedImage(imageData);
    stopCamera();
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    
    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
    if (!apiKey) {
      alert('Please set your VITE_ANTHROPIC_API_KEY in the .env file');
      return;
    }
    
    setAnalyzing(true);
    try {
      const base64Data = capturedImage.split(',')[1];
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/jpeg',
                  data: base64Data
                }
              },
              {
                type: 'text',
                text: 'Analyze this food image and provide nutritional estimates. Respond ONLY with a JSON object (no markdown, no backticks, no preamble) in this exact format: {"name": "food name", "calories": number, "protein": number, "carbs": number, "fats": number}. Estimate for a typical serving size.'
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const text = data.content.map((item: { type: string; text?: string }) => 
        item.type === 'text' ? item.text : ''
      ).join('');
      const cleanText = text.replace(/```json|```/g, '').trim();
      const nutritionData: AnalyzedNutrition = JSON.parse(cleanText);
      
      setMealName(nutritionData.name);
      setCalories(nutritionData.calories.toString());
      setProtein(nutritionData.protein.toString());
      setCarbs(nutritionData.carbs.toString());
      setFats(nutritionData.fats.toString());
      setCapturedImage(null);
    } catch (err) {
      alert('Error analyzing image. Please try again or enter manually.');
      console.error('Analysis error:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const addMeal = () => {
    if (mealName && calories) {
      const newMeal: Meal = {
        id: Date.now(),
        name: mealName,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      };
      setMeals([...meals, newMeal]);
      clearForm();
    }
  };

  const addScheduledMeal = () => {
    if (mealName && calories && selectedDay) {
      const newMeal: PlannedMeal = {
        id: Date.now(),
        name: mealName,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0,
        day: selectedDay,
        time: mealTime || ''
      };
      setPlannedMeals([...plannedMeals, newMeal]);
      clearForm();
    }
  };

  const clearForm = () => {
    setMealName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFats('');
    setMealTime('');
  };

  const saveRecipe = () => {
    if (mealName && calories) {
      const newRecipe: Recipe = {
        id: Date.now(),
        name: mealName,
        calories: parseFloat(calories) || 0,
        protein: parseFloat(protein) || 0,
        carbs: parseFloat(carbs) || 0,
        fats: parseFloat(fats) || 0
      };
      setSavedRecipes([...savedRecipes, newRecipe]);
      clearForm();
      alert('Recipe saved successfully!');
    }
  };

  const loadRecipe = (recipe: Recipe) => {
    setMealName(recipe.name);
    setCalories(recipe.calories.toString());
    setProtein(recipe.protein.toString());
    setCarbs(recipe.carbs.toString());
    setFats(recipe.fats.toString());
    setShowRecipeSelector(false);
  };

  const quickAddRecipeToSchedule = (recipe: Recipe, day: string, time: string) => {
    const newMeal: PlannedMeal = {
      id: Date.now(),
      name: recipe.name,
      calories: recipe.calories,
      protein: recipe.protein,
      carbs: recipe.carbs,
      fats: recipe.fats,
      day: day,
      time: time
    };
    setPlannedMeals([...plannedMeals, newMeal]);
  };

  const logPlannedMeal = (plannedMeal: PlannedMeal) => {
    const newMeal: Meal = {
      id: Date.now(),
      name: plannedMeal.name,
      calories: plannedMeal.calories,
      protein: plannedMeal.protein,
      carbs: plannedMeal.carbs,
      fats: plannedMeal.fats,
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    setMeals([...meals, newMeal]);
  };

  const deleteMeal = (id: number) => {
    setMeals(meals.filter(meal => meal.id !== id));
  };

  const deleteScheduledMeal = (id: number) => {
    setPlannedMeals(plannedMeals.filter(meal => meal.id !== id));
  };

  const deleteRecipe = (id: number) => {
    setSavedRecipes(savedRecipes.filter(recipe => recipe.id !== id));
  };

  const totals: NutritionTotals = meals.reduce((acc, meal) => ({
    calories: acc.calories + meal.calories,
    protein: acc.protein + meal.protein,
    carbs: acc.carbs + meal.carbs,
    fats: acc.fats + meal.fats
  }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

  const getMealsByDay = (day: string) => {
    return plannedMeals.filter(meal => meal.day === day).sort((a, b) => {
      if (!a.time) return 1;
      if (!b.time) return -1;
      return a.time.localeCompare(b.time);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-indigo-600" />
              <h1 className="text-3xl font-bold text-gray-800">Diet Tracker</h1>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>

          {/* Settings Modal */}
          {showSettings && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-800">Daily Goals</h3>
                  <button onClick={() => setShowSettings(false)} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Calories</label>
                    <input
                      type="number"
                      value={dailyGoals.calories}
                      onChange={(e) => setDailyGoals({...dailyGoals, calories: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g)</label>
                    <input
                      type="number"
                      value={dailyGoals.protein}
                      onChange={(e) => setDailyGoals({...dailyGoals, protein: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      value={dailyGoals.carbs}
                      onChange={(e) => setDailyGoals({...dailyGoals, carbs: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fats (g)</label>
                    <input
                      type="number"
                      value={dailyGoals.fats}
                      onChange={(e) => setDailyGoals({...dailyGoals, fats: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Save Goals
                </button>
              </div>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${
                activeTab === 'today'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Clock className="w-4 h-4" />
              Today
            </button>
            <button
              onClick={() => setActiveTab('plan')}
              className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${
                activeTab === 'plan'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Meal Plan
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex items-center gap-2 px-4 py-2 font-semibold transition-colors ${
                activeTab === 'recipes'
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Recipes
            </button>
          </div>

          {/* Camera Modal */}
          {(showCamera || capturedImage) && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-gray-800">
                    {capturedImage ? 'Review Photo' : 'Capture Food'}
                  </h3>
                  <button onClick={() => { stopCamera(); setCapturedImage(null); }} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                {showCamera && !capturedImage && (
                  <>
                    <video 
                      ref={videoRef} 
                      autoPlay 
                      playsInline
                      className="w-full rounded-lg mb-4"
                    />
                    <button
                      onClick={capturePhoto}
                      className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-5 h-5" />
                      Capture Photo
                    </button>
                  </>
                )}

                {capturedImage && (
                  <>
                    <img src={capturedImage} alt="Captured food" className="w-full rounded-lg mb-4" />
                    <div className="flex gap-3">
                      <button
                        onClick={() => setCapturedImage(null)}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                      >
                        Retake
                      </button>
                      <button
                        onClick={analyzeImage}
                        disabled={analyzing}
                        className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
                      >
                        {analyzing ? 'Analyzing...' : 'Analyze Food'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Recipe Detail Modal */}
          {selectedRecipe && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-96 overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-2xl font-bold text-gray-800">{selectedRecipe.name}</h3>
                  <button onClick={() => setSelectedRecipe(null)} className="text-gray-500 hover:text-gray-700">
                    <X className="w-6 h-6" />
                  </button>
                </div>
                
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <div className="bg-indigo-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600">Calories</div>
                    <div className="text-xl font-bold text-indigo-600">{selectedRecipe.calories}</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600">Protein</div>
                    <div className="text-xl font-bold text-red-600">{selectedRecipe.protein}g</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600">Carbs</div>
                    <div className="text-xl font-bold text-yellow-600">{selectedRecipe.carbs}g</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-sm text-gray-600">Fats</div>
                    <div className="text-xl font-bold text-green-600">{selectedRecipe.fats}g</div>
                  </div>
                </div>

                {selectedRecipe.recipe && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-2">Recipe</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedRecipe.recipe}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Today Tab */}
          {activeTab === 'today' && (
            <>
              {/* Daily Progress */}
              <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Progress</h2>
                <ProgressBar 
                  label="Calories" 
                  current={totals.calories} 
                  goal={dailyGoals.calories}
                  color="bg-indigo-600"
                />
                <ProgressBar 
                  label="Protein (g)" 
                  current={totals.protein} 
                  goal={dailyGoals.protein}
                  color="bg-red-500"
                />
                <ProgressBar 
                  label="Carbs (g)" 
                  current={totals.carbs} 
                  goal={dailyGoals.carbs}
                  color="bg-yellow-500"
                />
                <ProgressBar 
                  label="Fats (g)" 
                  current={totals.fats} 
                  goal={dailyGoals.fats}
                  color="bg-green-500"
                />
              </div>

              {/* Add Meal Form */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Log a Meal</h2>
                
                <button
                  onClick={startCamera}
                  className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 mb-4"
                >
                  <Camera className="w-5 h-5" />
                  Take Photo of Food
                </button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 text-gray-500">or enter manually</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Meal name"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Calories"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <input
                    type="number"
                    placeholder="Protein (g)"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Carbs (g)"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Fats (g)"
                    value={fats}
                    onChange={(e) => setFats(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={saveRecipe}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    Save as Recipe
                  </button>
                  <button
                    onClick={addMeal}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add Meal
                  </button>
                </div>
              </div>

              {/* Meals List */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Today's Meals</h2>
                {meals.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No meals logged yet. Start tracking your nutrition!</p>
                ) : (
                  <div className="space-y-3">
                    {meals.map((meal) => (
                      <div key={meal.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-800">{meal.name}</h3>
                            <p className="text-sm text-gray-500">{meal.time}</p>
                          </div>
                          <button
                            onClick={() => deleteMeal(meal.id)}
                            className="text-red-500 hover:text-red-700 transition-colors"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-sm">
                          <div className="bg-indigo-50 rounded px-2 py-1">
                            <div className="text-xs text-gray-600">Calories</div>
                            <div className="font-semibold text-indigo-600">{meal.calories}</div>
                          </div>
                          <div className="bg-red-50 rounded px-2 py-1">
                            <div className="text-xs text-gray-600">Protein</div>
                            <div className="font-semibold text-red-600">{meal.protein}g</div>
                          </div>
                          <div className="bg-yellow-50 rounded px-2 py-1">
                            <div className="text-xs text-gray-600">Carbs</div>
                            <div className="font-semibold text-yellow-600">{meal.carbs}g</div>
                          </div>
                          <div className="bg-green-50 rounded px-2 py-1">
                            <div className="text-xs text-gray-600">Fats</div>
                            <div className="font-semibold text-green-600">{meal.fats}g</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Recipes Tab */}
          {activeTab === 'recipes' && (
            <div>
              {/* Recipe Camera Modal */}
              {(showRecipeCamera || recipeCapturedImage) && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-800">
                        {recipeCapturedImage ? 'Review Photo' : 'Capture Recipe'}
                      </h3>
                      <button onClick={() => { stopCamera(); setRecipeCapturedImage(null); }} className="text-gray-500 hover:text-gray-700">
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    
                    {showRecipeCamera && !recipeCapturedImage && (
                      <>
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline
                          className="w-full rounded-lg mb-4"
                        />
                        <button
                          onClick={captureRecipePhoto}
                          className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                        >
                          <Camera className="w-5 h-5" />
                          Capture Photo
                        </button>
                      </>
                    )}

                    {recipeCapturedImage && (
                      <>
                        <img src={recipeCapturedImage} alt="Captured recipe" className="w-full rounded-lg mb-4" />
                        <div className="flex gap-3">
                          <button
                            onClick={() => setRecipeCapturedImage(null)}
                            className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                          >
                            Retake
                          </button>
                          <button
                            onClick={analyzeRecipeImage}
                            disabled={analyzingRecipe}
                            className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:bg-purple-400"
                          >
                            {analyzingRecipe ? 'Analyzing...' : 'Add Recipe'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Saved Recipes</h2>
              </div>

              {/* Add Recipe via Camera/Upload */}
              <div className="bg-purple-50 rounded-xl p-4 mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Add Recipe from Photo</h3>
                <div className="flex gap-3">
                  <button
                    onClick={startRecipeCamera}
                    className="flex-1 bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Take Photo
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Photo
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Take a photo of food or a recipe card to automatically add it</p>
              </div>

              {savedRecipes.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">No saved recipes yet</p>
                  <p className="text-sm text-gray-400">Save meals as recipes from the Today tab to reuse them later</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedRecipes.map((recipe) => (
                    <div key={recipe.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-gray-800 text-lg">{recipe.name}</h3>
                        <button
                          onClick={() => deleteRecipe(recipe.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm mb-3">
                        <div className="bg-indigo-50 rounded px-2 py-1">
                          <div className="text-xs text-gray-600">Calories</div>
                          <div className="font-semibold text-indigo-600">{recipe.calories}</div>
                        </div>
                        <div className="bg-red-50 rounded px-2 py-1">
                          <div className="text-xs text-gray-600">Protein</div>
                          <div className="font-semibold text-red-600">{recipe.protein}g</div>
                        </div>
                        <div className="bg-yellow-50 rounded px-2 py-1">
                          <div className="text-xs text-gray-600">Carbs</div>
                          <div className="font-semibold text-yellow-600">{recipe.carbs}g</div>
                        </div>
                        <div className="bg-green-50 rounded px-2 py-1">
                          <div className="text-xs text-gray-600">Fats</div>
                          <div className="font-semibold text-green-600">{recipe.fats}g</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={() => setSelectedRecipe(recipe)}
                          className="w-full bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
                        >
                          View Recipe
                        </button>
                        <button
                          onClick={() => {
                            const day = prompt('Which day? (Monday, Tuesday, etc.):');
                            const time = prompt('What time? (e.g., 12:00 or leave empty):');
                            if (day && daysOfWeek.includes(day)) {
                              quickAddRecipeToSchedule(recipe, day, time || '');
                              alert(`Added to ${day}!`);
                            }
                          }}
                          className="w-full bg-purple-600 text-white py-2 rounded-lg font-semibold hover:bg-purple-700 transition-colors text-sm flex items-center justify-center gap-2"
                        >
                          <Calendar className="w-4 h-4" />
                          Quick Add to Meal Plan
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('today');
                            loadRecipe(recipe);
                          }}
                          className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm"
                        >
                          Use Recipe
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === 'plan' && (
            <>
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Add to Meal Plan</h2>
                
                <button
                  onClick={() => setShowRecipeSelector(!showRecipeSelector)}
                  className="w-full bg-purple-600 text-white py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 mb-4"
                >
                  <BookOpen className="w-5 h-5" />
                  {showRecipeSelector ? 'Hide Recipes' : 'Load from Recipes'}
                </button>

                {showRecipeSelector && (
                  <div className="mb-4 bg-white border-2 border-purple-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-3">Select a Recipe</h3>
                    {savedRecipes.length === 0 ? (
                      <p className="text-gray-500 text-sm">No saved recipes yet. Save recipes from the Today or Recipes tab!</p>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {savedRecipes.map((recipe) => (
                          <button
                            key={recipe.id}
                            onClick={() => loadRecipe(recipe)}
                            className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                          >
                            <div className="font-medium text-gray-800">{recipe.name}</div>
                            <div className="text-sm text-gray-600">{recipe.calories} cal • {recipe.protein}g protein</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week</label>
                  <select
                    value={selectedDay}
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    {daysOfWeek.map(day => (
                      <option key={day} value={day}>{day}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Meal name"
                    value={mealName}
                    onChange={(e) => setMealName(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <input
                    type="time"
                    placeholder="Time (optional)"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="number"
                    placeholder="Calories"
                    value={calories}
                    onChange={(e) => setCalories(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Protein (g)"
                    value={protein}
                    onChange={(e) => setProtein(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <input
                    type="number"
                    placeholder="Carbs (g)"
                    value={carbs}
                    onChange={(e) => setCarbs(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Fats (g)"
                    value={fats}
                    onChange={(e) => setFats(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={addScheduledMeal}
                  className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add to Meal Plan
                </button>
              </div>

              <div className="space-y-6">
                {daysOfWeek.map((day) => {
                  const dayMeals = getMealsByDay(day);
                  return (
                    <div key={day} className="bg-white rounded-xl p-5 border border-gray-200">
                      <h2 className="text-lg font-semibold text-gray-800 mb-3">{day}</h2>
                      {dayMeals.length === 0 ? (
                        <p className="text-gray-400 text-sm italic">No meals planned</p>
                      ) : (
                        <div className="space-y-2">
                          {dayMeals.map((meal) => (
                            <div key={meal.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h3 className="font-semibold text-gray-800">{meal.name}</h3>
                                  {meal.time && <p className="text-sm text-indigo-600 font-medium">{meal.time}</p>}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => logPlannedMeal(meal)}
                                    className="text-green-600 hover:text-green-700 text-sm font-medium px-3 py-1 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                                  >
                                    Log Now
                                  </button>
                                  <button
                                    onClick={() => deleteScheduledMeal(meal.id)}
                                    className="text-red-500 hover:text-red-700 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div className="grid grid-cols-4 gap-2 text-sm">
                                <div className="bg-indigo-50 rounded px-2 py-1">
                                  <div className="text-xs text-gray-600">Calories</div>
                                  <div className="font-semibold text-indigo-600">{meal.calories}</div>
                                </div>
                                <div className="bg-red-50 rounded px-2 py-1">
                                  <div className="text-xs text-gray-600">Protein</div>
                                  <div className="font-semibold text-red-600">{meal.protein}g</div>
                                </div>
                                <div className="bg-yellow-50 rounded px-2 py-1">
                                  <div className="text-xs text-gray-600">Carbs</div>
                                  <div className="font-semibold text-yellow-600">{meal.carbs}g</div>
                                </div>
                                <div className="bg-green-50 rounded px-2 py-1">
                                  <div className="text-xs text-gray-600">Fats</div>
                                  <div className="font-semibold text-green-600">{meal.fats}g</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
