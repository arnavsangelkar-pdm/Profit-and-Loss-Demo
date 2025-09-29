# P&L Statement Cleaner

A React-based application designed to standardize and process Profit & Loss (P&L) statements using OpenAI's language models. This tool assists financial professionals and businesses in processing, standardizing, and analyzing P&L data from various sources and formats.

## Features

- **File Upload Support**: Upload P&L statements in CSV, Excel, and other common formats
- **AI-Powered Standardization**: Utilizes OpenAI GPT models to intelligently standardize financial data
- **Interactive Data Preview**: Preview and validate data before processing
- **Real-time Processing**: Clean and standardize data with live feedback
- **Export Capabilities**: Export cleaned data in multiple formats
- **Modern User Interface**: Built with React and Tailwind CSS for a clean, responsive interface
- **Debug Information**: Comprehensive debugging tools for data processing

## Technology Stack

- **Frontend**: React 18.2.0
- **Styling**: Tailwind CSS 3.3.0
- **AI Integration**: OpenAI API 4.20.1
- **File Processing**: PapaParse, XLSX
- **Icons**: Lucide React
- **Build Tool**: Create React App

## Prerequisites

Before running this application, ensure you have:

- Node.js (v14 or higher)
- npm or yarn package manager
- OpenAI API key

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/arnavsangelkar-pdm/Profit-and-Loss-Demo.git
cd pl-statement-cleaner
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add your OpenAI API key:

```env
REACT_APP_OPENAI_API_KEY=your_openai_api_key_here
```

### 4. Start the Development Server

```bash
npm start
```

The application will be available at `http://localhost:3000`.

## Project Structure

```
pl-statement-cleaner/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── CleanedOutput.js      # Display cleaned data
│   │   ├── DataPreview.js        # Preview uploaded data
│   │   ├── DebugInfo.js          # Debug information panel
│   │   ├── FileUpload.js         # File upload component
│   │   ├── OpenAIConfig.js       # OpenAI configuration
│   │   └── StandardizationPanel.js # Data standardization controls
│   ├── utils/
│   │   ├── fileProcessor.js      # File processing utilities
│   │   ├── openaiService.js      # OpenAI API integration
│   │   └── standardizer.js       # Data standardization logic
│   ├── App.js                    # Main application component
│   ├── index.js                  # Application entry point
│   └── index.css                 # Global styles
├── package.json
├── tailwind.config.js
└── README.md
```

## Usage

### 1. Upload P&L Data
- Click the upload area or drag and drop your P&L statement file
- Supported formats: CSV, Excel (.xlsx, .xls), and other common formats

### 2. Preview Data
- Review the uploaded data in the preview panel
- Check for any formatting issues or inconsistencies

### 3. Configure OpenAI Settings
- Enter your OpenAI API key if not set in environment variables
- Adjust model parameters as needed

### 4. Standardize Data
- Click "Standardize Data" to process your P&L statement
- The AI will clean and standardize the financial data

### 5. Review Results
- Examine the cleaned output
- Use debug information to understand the processing steps
- Export the standardized data

## Testing

Execute the test suite:

```bash
npm test
```

## Production Build

Generate a production build:

```bash
npm run build
```

The build files will be located in the `build/` directory.

## Sample Data

The repository includes sample P&L data files for testing:
- `test-pl-data.csv` - Sample P&L statement in CSV format
- Various test files for different scenarios

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `REACT_APP_OPENAI_API_KEY` | Your OpenAI API key | Yes |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request


## Acknowledgments

- OpenAI for providing powerful language models
- React team for the excellent framework
- Tailwind CSS for the utility-first CSS framework
- All contributors and users of this project
