# Import libraries
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, r2_score
import matplotlib.pyplot as plt

# Load data
data = pd.read_csv('\generated_expense_income_data.csv')

# Show columns for debugging
print("Data Columns:", data.columns.tolist())

# Convert 'Date' column to datetime
data['Date'] = pd.to_datetime(data['Date'])

# Encode ALL object (string) type columns except 'Date'
label_encoders = {}
for column in data.select_dtypes(include=['object']).columns:
    if column != 'Date':
        le = LabelEncoder()
        data[column] = le.fit_transform(data[column])
        label_encoders[column] = le

# Create a new 'Month' column
data['Month'] = data['Date'].dt.month
data['Year'] = data['Date'].dt.year

# Group data by Year and Month to calculate monthly expenses
monthly_expenses = data.groupby(['Year', 'Month'])['Amount'].sum().reset_index()

# Prepare Features (Year, Month) and Target (Total Expense)
X_monthly = monthly_expenses[['Year', 'Month']]
y_monthly = monthly_expenses['Amount']

# Train-Test Split for monthly prediction
X_train_monthly, X_test_monthly, y_train_monthly, y_test_monthly = train_test_split(X_monthly, y_monthly, test_size=0.2, random_state=42)

# Train a model specifically for predicting total monthly expenses
monthly_model = RandomForestRegressor(random_state=42)
monthly_model.fit(X_train_monthly, y_train_monthly)

# Predict next month's expenses
# Assuming last available year and month
last_year = monthly_expenses['Year'].max()
last_month = monthly_expenses[monthly_expenses['Year'] == last_year]['Month'].max()

if last_month == 12:
    next_month = 1
    next_year = last_year + 1
else:
    next_month = last_month + 1
    next_year = last_year

next_input = np.array([[next_year, next_month]])
predicted_next_month_expense = monthly_model.predict(next_input)

print(f"\n🔮 Predicted Total Expense for {next_year}-{next_month:02d}: ₹{predicted_next_month_expense[0]:.2f}")

# Detect Expense Trend
# Simple approach: linear fit
monthly_expenses['Month_Encoded'] = range(len(monthly_expenses))
trend_model = LinearRegression()
trend_model.fit(monthly_expenses[['Month_Encoded']], monthly_expenses['Amount'])
slope = trend_model.coef_[0]

if slope > 0:
    trend = "increasing 📈"
elif slope < 0:
    trend = "decreasing 📉"
else:
    trend = "stable ➡"

print(f"\n📊 Expenditure Trend Over Time: {trend}")

# Plot for visualization
plt.figure(figsize=(10,6))
plt.plot(monthly_expenses['Month_Encoded'], monthly_expenses['Amount'], marker='o')
plt.title('Monthly Expenses Over Time')
plt.xlabel('Time (months)')
plt.ylabel('Total Expense (₹)')
plt.grid(True)
plt.show()

# ------- Your GST models (keep them as well) -------

# Features and Target for GST prediction
columns_to_drop = [col for col in ['Date', 'GST Amount'] if col in data.columns]
X = data.drop(columns=columns_to_drop, axis=1)
y = data['GST Amount']

# Train-Test Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Model 1: Linear Regression
lr_model = LinearRegression()
lr_model.fit(X_train, y_train)
y_pred_lr = lr_model.predict(X_test)

# Model 2: Decision Tree Regressor
dt_model = DecisionTreeRegressor(random_state=42)
dt_model.fit(X_train, y_train)
y_pred_dt = dt_model.predict(X_test)

# Model 3: Random Forest Regressor
rf_model = RandomForestRegressor(random_state=42)
rf_model.fit(X_train, y_train)
y_pred_rf = rf_model.predict(X_test)

# Evaluation
def evaluate_model(name, y_true, y_pred):
    print(f"\n{name} Model:")
    print("Mean Squared Error:", mean_squared_error(y_true, y_pred))
    print("R2 Score:", r2_score(y_true, y_pred))

evaluate_model("Linear Regression", y_test, y_pred_lr)
evaluate_model("Decision Tree", y_test, y_pred_dt)
evaluate_model("Random Forest", y_test, y_pred_rf)

# Predict a sample input
sample_input = X_test.iloc[0].values.reshape(1, -1)
predicted_gst = rf_model.predict(sample_input)
print(f"\n🔮 Predicted GST Amount for a sample input: ₹{predicted_gst[0]:.2f}")