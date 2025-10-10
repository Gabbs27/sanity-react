# Gabriel Abreu - Portfolio Website

A modern, responsive portfolio website built with React and Sanity CMS, showcasing projects, blog posts, and professional services.

![Portfolio](https://img.shields.io/badge/React-18.2.0-blue)
![Sanity](https://img.shields.io/badge/Sanity-CMS-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## 🌐 Live Demo

Visit: [codewithgabo.com](http://codewithgabo.com)

## ✨ Features

- 📱 **Fully Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- 📝 **Dynamic Blog** - Powered by Sanity CMS with rich text support and code syntax highlighting
- 🎨 **Modern UI/UX** - Clean, professional design with smooth animations
- 🔍 **Search Functionality** - Search through projects, blog posts, and repositories
- 📊 **GitHub Integration** - Display your latest repositories dynamically
- 📈 **Analytics** - Google Analytics integration for tracking visitor insights
- 🎯 **SEO Optimized** - Meta tags and optimized structure for better search rankings

## 🛠️ Tech Stack

### Frontend
- **React** 18.2.0 - UI library
- **React Router** 6.6.1 - Client-side routing
- **Axios** - HTTP client for API requests
- **React Reveal** - Scroll animations
- **Font Awesome** - Icon library
- **Tailwind CSS** - Utility-first CSS framework
- **BaseUI** - UI component library

### Backend/CMS
- **Sanity CMS** - Headless CMS for content management
- **Sanity Client** - API client for fetching content

### Analytics & Deployment
- **Google Analytics** - User tracking and analytics
- **GitHub Pages** - Hosting platform

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- A [Sanity](https://www.sanity.io/) account
- A [GitHub Personal Access Token](https://github.com/settings/tokens) (for repository display)

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Gabbs27/sanity-react.git
cd sanity-react
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying the example file:

```bash
cp .env.example .env
```

Then, edit the `.env` file with your actual credentials:

```env
# Sanity CMS Configuration
REACT_APP_SANITY_PROJECT_ID=your_sanity_project_id
REACT_APP_SANITY_DATASET=production
REACT_APP_SANITY_API_VERSION=2022-12-30

# GitHub API Configuration
REACT_APP_GITHUB_USERNAME=your_github_username
REACT_APP_GITHUB_TOKEN=your_github_personal_access_token

# Analytics
REACT_APP_GA_TRACKING_ID=your_google_analytics_id
```

#### How to Get Your Credentials:

**Sanity Project ID:**
1. Log in to [Sanity.io](https://www.sanity.io/)
2. Navigate to your project dashboard
3. Find your project ID in the project settings

**GitHub Token:**
1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Select `public_repo` scope
4. Copy the generated token

**Google Analytics ID:**
1. Create a property in [Google Analytics](https://analytics.google.com/)
2. Copy your Measurement ID (starts with `G-`)

### 4. Set Up Sanity Studio

Navigate to the Sanity directory and install dependencies:

```bash
cd codewithgabo
npm install
```

Start the Sanity Studio locally:

```bash
npm run dev
```

The studio will be available at `http://localhost:3333`

### 5. Run the Development Server

In the root directory:

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
sanity-react/
├── public/                 # Static files
│   ├── images/            # Project images
│   └── cv.pdf             # Resume/CV
├── src/
│   ├── assets/            # Images, data files, and static assets
│   ├── components/        # React components
│   │   ├── card/         # Card components
│   │   ├── Greeting/     # Greeting components
│   │   └── navheader/    # Navigation components
│   ├── hooks/            # Custom React hooks
│   │   └── useAnalytics.js  # Analytics hook
│   ├── App.js            # Main app component
│   ├── client.js         # Sanity client configuration
│   └── index.js          # App entry point
├── codewithgabo/         # Sanity Studio
│   ├── schemas/          # Sanity schema definitions
│   └── sanity.config.js  # Sanity configuration
├── .env                  # Environment variables (create this)
├── .env.example          # Environment variables template
└── package.json          # Dependencies and scripts
```

## 🎨 Customization

### Update Personal Information

Edit the following files to customize with your information:

- `src/assets/data.js` - Project data
- `src/assets/gabriel.js` - Personal information
- `src/assets/about.js` - About page content
- `src/assets/educationData.js` - Education history

### Modify Styles

- Global styles: `src/index.css`
- Component-specific styles: Located in component directories
- Tailwind configuration: Imported via CDN (consider local installation)

### Add New Blog Posts

1. Navigate to your Sanity Studio (http://localhost:3333)
2. Click "Post" in the left sidebar
3. Create a new post with title, content, images, etc.
4. Publish the post

Changes will automatically reflect on your portfolio once published.

## 📦 Building for Production

Create an optimized production build:

```bash
npm run build
```

The build folder will contain your optimized application ready for deployment.

## 🚢 Deployment

### Deploy to GitHub Pages

```bash
npm run deploy
```

This will build your app and deploy it to GitHub Pages.

### Deploy Sanity Studio

```bash
cd codewithgabo
npm run deploy
```

## 🔒 Security Notes

⚠️ **IMPORTANT**: Never commit your `.env` file to version control. It contains sensitive credentials.

- The `.env` file is already included in `.gitignore`
- Use `.env.example` as a template for other developers
- Rotate your tokens regularly
- Use environment-specific variables for different environments

## 🐛 Troubleshooting

### Common Issues

**Issue: "Module not found" errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Issue: Sanity content not loading**
- Verify your Sanity Project ID in `.env`
- Check that your Sanity dataset is set to "production"
- Ensure CORS is enabled in Sanity project settings

**Issue: GitHub repositories not showing**
- Verify your GitHub token has the correct permissions
- Check that the token hasn't expired
- Ensure the username in `.env` is correct

## 📝 Available Scripts

- `npm start` - Run development server
- `npm run build` - Create production build
- `npm test` - Run tests
- `npm run deploy` - Deploy to GitHub Pages

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 👤 Author

**Gabriel Abreu (Gabbs27)**

- Website: [codewithgabo.com](http://codewithgabo.com)
- GitHub: [@Gabbs27](https://github.com/Gabbs27)
- LinkedIn: [Francisco Gabriel Abreu Cornelio](https://www.linkedin.com/in/francisco-gabriel-abreu-cornelio/)
- Email: fco.g.abreu@gmail.com

## 🙏 Acknowledgments

- [Create React App](https://create-react-app.dev/)
- [Sanity.io](https://www.sanity.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Font Awesome](https://fontawesome.com/)

---

⭐ If you found this project helpful, please consider giving it a star!
