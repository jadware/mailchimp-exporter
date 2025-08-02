
const fs = require('fs')
const path = require('path')
const https = require('https')

const apiKeyPath = path.join(__dirname, 'mailchimp-api-key.json')
const baseDir = __dirname

function readApiKey()
{
	console.log('🔑 Reading API key...')
	const { apiKey } = JSON.parse(fs.readFileSync(apiKeyPath, 'utf8'))
	if(!apiKey.includes('-')) throw new Error('API key must include datacenter suffix')
	const [_, dc] = apiKey.split('-')
	console.log(`🔐 API key loaded for datacenter: ${dc}`)
	return { apiKey, datacenter: dc }
}

function apiRequest({ apiKey, datacenter }, endpoint)
{
	console.log(`🌐 API GET ${endpoint}`)
	return new Promise((resolve, reject) =>
	{
		const options = {
			hostname: `${datacenter}.api.mailchimp.com`,
			path: `/3.0${endpoint}`,
			method: 'GET',
			headers: {
				'Authorization': `anystring ${apiKey}`,
				'User-Agent': 'mailchimp-export'
			}
		}

		const req = https.request(options, res =>
		{
			let data = ''
			res.on('data', chunk => data += chunk)
			res.on('end', () =>
			{
				if(res.statusCode >= 400) {
					console.warn(`❌ HTTP ${res.statusCode}: ${endpoint}`)
					return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`))
				}
				try { resolve(JSON.parse(data)) }
				catch(e) {
					console.warn('❌ Failed to parse JSON')
					reject(new Error('Invalid JSON'))
				}
			})
		})

		req.on('error', err => {
			console.error(`❌ Request error: ${err.message}`)
			reject(err)
		})
		req.end()
	})
}

function sanitize(name)
{
	return name.replace(/[^a-z0-9\-_\s]/gi, '_').slice(0, 64)
}

function ensureDir(p)
{
	if(!fs.existsSync(p)) {
		fs.mkdirSync(p, { recursive: true })
		console.log(`📁 Created folder: ${p}`)
	}
}

async function writeJSON(folder, name, data)
{
	fs.writeFileSync(path.join(folder, name), JSON.stringify(data, null, 2))
	console.log(`  💾 Wrote ${name}`)
}

async function exportTemplates(auth)
{
	console.log('→ Exporting templates...')
	const dir = path.join(baseDir, 'templates')
	ensureDir(dir)

	const { templates } = await apiRequest(auth, '/templates?count=1000')
	console.log(`  ↳ Found ${templates.length} templates`)

	for(const t of templates)
	{
		const folder = path.join(dir, `${sanitize(t.name)}-${t.id}`)
		ensureDir(folder)
		console.log(`    ↳ Processing template: ${t.name}`)

		await writeJSON(folder, 'template.json', t)

		try {
			const content = await apiRequest(auth, `/templates/${t.id}`)
			if(content.edit_source) {
				fs.writeFileSync(path.join(folder, 'template.html'), content.edit_source)
				console.log(`      ✓ template.html saved`)
			}
		} catch (e) {
			console.warn(`      ⚠ Failed to get template HTML: ${e.message}`)
		}
	}
}

async function exportFileManager(auth)
{
	console.log('→ Exporting file manager files...')
	const dir = path.join(baseDir, 'assets')
	ensureDir(dir)

	try {
		const files = await apiRequest(auth, '/file-manager/files')
		await writeJSON(dir, 'files.json', files)
		console.log(`  ✓ Saved ${files.files?.length || 0} files to assets/files.json`)
	} catch (e) {
		console.warn(`  ⚠ Failed to export file manager: ${e.message}`)
	}
}

async function exportSurveys(auth)
{
	console.log('→ Exporting surveys...')
	const dir = path.join(baseDir, 'surveys')
	ensureDir(dir)

	try {
		const surveys = await apiRequest(auth, '/surveys')
		await writeJSON(dir, 'surveys.json', surveys)
		console.log('  ✓ surveys.json saved')
	} catch (e) {
		console.warn(`  ⚠ Failed to export surveys: ${e.message}`)
	}
}

async function exportEcommerce(auth)
{
	console.log('→ Exporting ecommerce stores...')
	const dir = path.join(baseDir, 'ecommerce/stores')
	ensureDir(dir)

	try {
		const { stores } = await apiRequest(auth, '/ecommerce/stores?count=100')
		for(const s of stores)
		{
			const folder = path.join(dir, `${sanitize(s.name)}-${s.id}`)
			ensureDir(folder)

			await writeJSON(folder, 'store.json', s)

			try {
				const orders = await apiRequest(auth, `/ecommerce/stores/${s.id}/orders`)
				await writeJSON(folder, 'orders.json', orders)
			} catch (e) {
				console.warn(`  ⚠ Failed to get orders for store ${s.id}: ${e.message}`)
			}
		}
		console.log(`  ✓ Exported ${stores.length} stores`)
	} catch (e) {
		console.warn(`  ⚠ Failed to export ecommerce stores: ${e.message}`)
	}
}

async function main()
{
	console.log('🚀 Starting Mailchimp export...')
	const auth = readApiKey()

	await exportTemplates(auth)
	await exportFileManager(auth)
	await exportSurveys(auth)
	await exportEcommerce(auth)

	console.log('✅ Export complete')
}

main().catch(err => {
	console.error('❌ Fatal:', err.message)
	process.exit(1)
})
