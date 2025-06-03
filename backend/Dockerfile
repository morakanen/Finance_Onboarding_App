# lightweight python image
FROM python:3.12-slim

#sets working directory
WORKDIR /app

# Copy requirement file first (for caching pip installs)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Download NLTK data
RUN python -m nltk.downloader punkt stopwords wordnet

# Copy the rest of your backend code into /app
COPY . .

# Expose port 8000 for FastAPI
EXPOSE 8000

# Command to start the FastAPI server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]