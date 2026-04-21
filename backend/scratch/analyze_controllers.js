const fs = require('fs');
const path = require('path');

const baseDir = 'c:\\Users\\DELL\\Desktop\\indoor-sports-complex-management-system\\indoor-sports-complex-management-system\\backend\\src\\controllers';

function analyzeFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    const exports = [];
    const imports = [];
    const methodDetails = {};
    
    // Detect exports.something = ... or exports[something] = ...
    lines.forEach(line => {
        const exportMatch = line.match(/exports\.(\w+)\s*=/);
        if (exportMatch) {
            exports.push(exportMatch[1]);
        }
        
        // Detect requires
        const requireMatch = line.match(/(?:const|var|let)\s+(\{?[\w,\s]+\}?)\s*=\s*require\(['"](.+)['"]\)/);
        if (requireMatch) {
            imports.push({ variable: requireMatch[1].trim(), path: requireMatch[2] });
        }
    });

    // Detect module.exports = { ... }
    const moduleExportMatch = content.match(/module\.exports\s*=\s*\{([\s\S]+?)\}/);
    if (moduleExportMatch) {
        const exportedItems = moduleExportMatch[1].split(',').map(s => s.trim().split(':')[0].trim()).filter(s => s && !s.startsWith('//'));
        exportedItems.forEach(item => {
            if (!exports.includes(item)) exports.push(item);
        });
    }

    // Extract parameters for each export
    exports.forEach(methodName => {
        // Find function definition to search for req.body, req.params, etc inside its block
        const escapedMethod = methodName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const functionRegex = new RegExp(`(?:async\\s+)?function\\s+${escapedMethod}\\s*\\(|exports\\.${escapedMethod}\\s*=\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>|${escapedMethod}\\s*:\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>`, 'g');
        
        // This is a bit complex for a script, so let's just search for common patterns globally in the file for now if we know which method we are looking at.
        // Actually, let's just grep the whole file for req.body/params/query and associate them with the controller if they appear.
    });

    // Simple parameter extraction (global for file)
    const bodyParams = [...new Set([...content.matchAll(/req\.body\.(\w+)|const\s+\{([^}]+)\}\s*=\s*req\.body/g)].flatMap(m => m[1] ? [m[1]] : m[2].split(',').map(s => s.trim().split(':')[0].trim())))];
    const queryParams = [...new Set([...content.matchAll(/req\.query\.(\w+)|const\s+\{([^}]+)\}\s*=\s*req\.query/g)].flatMap(m => m[1] ? [m[1]] : m[2].split(',').map(s => s.trim().split(':')[0].trim())))];
    const pathParams = [...new Set([...content.matchAll(/req\.params\.(\w+)|const\s+\{([^}]+)\}\s*=\s*req\.params/g)].flatMap(m => m[1] ? [m[1]] : m[2].split(',').map(s => s.trim().split(':')[0].trim())))];

    return {
        file: path.relative(baseDir, filePath),
        exports,
        imports,
        params: {
            body: bodyParams.filter(p => !p.startsWith('//') && p.length > 0),
            query: queryParams.filter(p => !p.startsWith('//') && p.length > 0),
            path: pathParams.filter(p => !p.startsWith('//') && p.length > 0)
        }
    };
}

const directories = ['', 'admin', 'coach', 'player'];
const results = [];

directories.forEach(dir => {
    const fullDir = path.join(baseDir, dir);
    if (!fs.existsSync(fullDir)) return;
    
    const files = fs.readdirSync(fullDir);
    files.forEach(file => {
        if (file.endsWith('.controller.js')) {
            results.push(analyzeFile(path.join(fullDir, file)));
        }
    });
});

const finalResults = JSON.stringify(results, null, 2);
fs.writeFileSync('backend/scratch/analysis_output.json', finalResults, 'utf8');
console.log("Analysis saved to backend/scratch/analysis_output.json");
