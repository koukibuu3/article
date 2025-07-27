const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const ARTICLE_DIR = 'Article';
const INDEX_FILE = 'index.json';
const TAGS_FILE = 'tags.json';

// Function to extract frontmatter from markdown content
function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return null;
  }
  
  try {
    return yaml.load(match[1]);
  } catch (error) {
    console.error('Error parsing YAML frontmatter:', error);
    return null;
  }
}

// Function to extract title from filename or content
function extractTitle(filename, content) {
  // Try to extract from filename (remove date prefix and extension)
  const titleFromFilename = filename
    .replace(/^\d{4}-\d{2}-\d{2}_/, '') // Remove date prefix
    .replace(/\.md$/, ''); // Remove .md extension
  
  // Try to extract from first heading in content
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) {
    return headingMatch[1].trim();
  }
  
  return titleFromFilename;
}

// Function to extract excerpt from content
function extractExcerpt(content, maxLength = 200) {
  // Remove frontmatter
  const contentWithoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, '');
  
  // Remove markdown syntax and get plain text
  const plainText = contentWithoutFrontmatter
    .replace(/!\[\[.*?\]\]/g, '') // Remove image links
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Replace links with text
    .replace(/[#*`_~]/g, '') // Remove markdown formatting
    .replace(/\n+/g, ' ') // Replace newlines with spaces
    .trim();
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  return plainText.substring(0, maxLength).trim() + '...';
}

// Main function to process articles and generate JSON files
function generateJsonFiles() {
  if (!fs.existsSync(ARTICLE_DIR)) {
    console.error(`Article directory '${ARTICLE_DIR}' not found`);
    return;
  }
  
  const articles = [];
  const tagsCount = {};
  
  // Read all markdown files from Article directory
  const files = fs.readdirSync(ARTICLE_DIR)
    .filter(file => file.endsWith('.md') && file !== 'README.md');
  
  files.forEach(filename => {
    const filepath = path.join(ARTICLE_DIR, filename);
    const content = fs.readFileSync(filepath, 'utf-8');
    const frontmatter = extractFrontmatter(content);
    
    if (!frontmatter) {
      console.warn(`No frontmatter found in ${filename}`);
      return;
    }
    
    const title = extractTitle(filename, content);
    const excerpt = extractExcerpt(content);
    
    const article = {
      id: frontmatter.id || filename.replace(/\.md$/, ''),
      title: title,
      excerpt: excerpt,
      tags: frontmatter.tags || [],
      createdAt: frontmatter.createdAt || frontmatter.publishedAt || null,
      publishedAt: frontmatter.publishedAt || frontmatter.createdAt || null,
      filename: filename,
      path: `Article/${filename}`
    };
    
    articles.push(article);
    
    // Count tags
    if (frontmatter.tags && Array.isArray(frontmatter.tags)) {
      frontmatter.tags.forEach(tag => {
        tagsCount[tag] = (tagsCount[tag] || 0) + 1;
      });
    }
  });
  
  // Sort articles by publishedAt (newest first)
  articles.sort((a, b) => {
    if (!a.publishedAt && !b.publishedAt) return 0;
    if (!a.publishedAt) return 1;
    if (!b.publishedAt) return -1;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
  
  // Generate index.json
  const indexData = {
    articles: articles,
    totalCount: articles.length,
    lastUpdated: new Date().toISOString()
  };
  
  // Generate tags.json with articles
  const tagsWithArticles = {};
  
  // Group articles by tags
  articles.forEach(article => {
    if (article.tags && Array.isArray(article.tags)) {
      article.tags.forEach(tag => {
        if (!tagsWithArticles[tag]) {
          tagsWithArticles[tag] = [];
        }
        tagsWithArticles[tag].push({
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          publishedAt: article.publishedAt,
          path: article.path
        });
      });
    }
  });
  
  const tagsData = {
    tags: Object.entries(tagsCount)
      .map(([name, count]) => ({
        name,
        count,
        articles: tagsWithArticles[name] || []
      }))
      .sort((a, b) => b.count - a.count), // Sort by count (descending)
    totalTags: Object.keys(tagsCount).length,
    lastUpdated: new Date().toISOString()
  };
  
  // Write files
  fs.writeFileSync(INDEX_FILE, JSON.stringify(indexData, null, 2));
  fs.writeFileSync(TAGS_FILE, JSON.stringify(tagsData, null, 2));
  
  console.log(`Generated ${INDEX_FILE} with ${articles.length} articles`);
  console.log(`Generated ${TAGS_FILE} with ${Object.keys(tagsCount).length} tags`);
  
  // Log summary
  console.log('\nArticles processed:');
  articles.forEach(article => {
    console.log(`- ${article.title} (${article.tags.join(', ')})`);
  });
  
  console.log('\nTags found:');
  Object.entries(tagsCount).forEach(([tag, count]) => {
    console.log(`- ${tag}: ${count} article(s)`);
  });
}

// Run the script
generateJsonFiles();