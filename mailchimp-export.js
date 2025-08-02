const fs = require('fs')
const path = require('path')
const https = require('https')

const apiKeyPath = path.join(__dirname, 'mailchimp-api-key.json')
const baseDir = path.join(__dirname, 'export');

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
//	console.log(`🌐 API GET ${endpoint}`)
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
				if(res.statusCode >= 400)
					return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`))
				try { resolve(JSON.parse(data)) }
				catch(e) { reject(new Error('Invalid JSON')) }
			})
		})

		req.on('error', reject)
		req.end()
	})
}

function sanitize(name)
{
	return name.replace(/[^a-z0-9\-\_\s]/gi, '_').slice(0, 64)
}

function ensureDir(p)
{
	if(!fs.existsSync(p)) {
		fs.mkdirSync(p, { recursive: true })
//		console.log(`📁 Created directory: ${p}`)
	}
}

async function writeJSON(folder, name, data)
{
	const filePath = path.join(folder, name)
	fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
	console.log(`✔ Wrote ${filePath}`)
}

async function exportCampaigns(auth)
{
	console.log('\n🔄 Exporting campaigns...')
	const dir = path.join(baseDir, 'campaigns')
	ensureDir(dir)

	const { campaigns } = await apiRequest(auth, '/campaigns?count=1000')
	for(const c of campaigns)
	{
		const name = sanitize(c.settings.title || c.id)
		const folder = path.join(dir, `${name}-${c.id}`)
		ensureDir(folder)

		await writeJSON(folder, 'metadata.json', c)

		try {
			const content = await apiRequest(auth, `/campaigns/${c.id}/content`)
			if(content.html) fs.writeFileSync(path.join(folder, 'content.html'), content.html)
			if(content.plain_text) fs.writeFileSync(path.join(folder, 'content.txt'), content.plain_text)
			console.log(`✔ Exported content for campaign ${c.id}`)
		} catch (e) {
			console.warn(`⚠ Failed to get content for ${c.id}:`, e.message)
		}

		try {
			const report = await apiRequest(auth, `/reports/${c.id}`)
			await writeJSON(folder, 'report.json', report)
		} catch {}

		try {
			const activity = await apiRequest(auth, `/reports/${c.id}/email-activity`)
			await writeJSON(folder, 'email-activity.json', activity)
		} catch {}
	}
}

async function exportTemplates(auth)
{
	console.log('\n🔄 Exporting templates...')
	const dir = path.join(baseDir, 'templates')
	ensureDir(dir)

	const { templates } = await apiRequest(auth, '/templates?count=1000')
	for(const t of templates)
	{
		const folder = path.join(dir, `${sanitize(t.name)}-${t.id}`)
		ensureDir(folder)

		await writeJSON(folder, 'template.json', t)

		try {
			const content = await apiRequest(auth, `/templates/${t.id}`)
			if(content.edit_source)
				fs.writeFileSync(path.join(folder, 'template.html'), content.edit_source)
		} catch {}
	}
}

async function exportAutomations(auth)
{
	console.log('\n🔄 Exporting automations...')
	const dir = path.join(baseDir, 'automations')
	ensureDir(dir)

	const { automations } = await apiRequest(auth, '/automations')
	for(const a of automations)
	{
		const folder = path.join(dir, `${sanitize(a.settings.title)}-${a.id}`)
		ensureDir(folder)

		await writeJSON(folder, 'automation.json', a)

		try {
			const emails = await apiRequest(auth, `/automations/${a.id}/emails`)
			await writeJSON(folder, 'emails.json', emails)
		} catch {}
	}
}

async function exportAudienceMetadata(auth)
{
	console.log('\n🔄 Exporting audience metadata...')
	const dir = path.join(baseDir, 'audience_metadata')
	ensureDir(dir)

	const { lists } = await apiRequest(auth, '/lists?count=100')
	for(const list of lists)
	{
		const folder = path.join(dir, `${sanitize(list.name)}-${list.id}`)
		ensureDir(folder)

		try {
			const segments = await apiRequest(auth, `/lists/${list.id}/segments`)
			await writeJSON(folder, 'segments.json', segments)
		} catch {}

		try {
			const tags = await apiRequest(auth, `/lists/${list.id}/tag-search`)
			await writeJSON(folder, 'tags.json', tags)
		} catch {}
	}
}

async function exportAudienceMembers(auth)
{
	console.log('\n🔄 Exporting audience members...')
	const dir = path.join(baseDir, 'audience_members')
	ensureDir(dir)

	const { lists } = await apiRequest(auth, '/lists?count=100')
	for(const list of lists)
	{
		const folder = path.join(dir, `${sanitize(list.name)}-${list.id}`)
		ensureDir(folder)

		let members = []
		let offset = 0
		const count = 1000

		while(true)
		{
			const data = await apiRequest(auth, `/lists/${list.id}/members?offset=${offset}&count=${count}`)
			members.push(...data.members)
			if(data.members.length < count) break
			offset += count
		}

		await writeJSON(folder, 'members.json', members)
	}
}

async function exportLandingPages(auth)
{
	console.log('\n🔄 Exporting landing pages...')
	const dir = path.join(baseDir, 'landing_pages')
	ensureDir(dir)

	const { campaigns } = await apiRequest(auth, '/campaigns?type=landing_page&count=1000')
	for(const c of campaigns)
	{
		const folder = path.join(dir, `${sanitize(c.settings.title)}-${c.id}`)
		ensureDir(folder)

		await writeJSON(folder, 'metadata.json', c)

		try {
			const content = await apiRequest(auth, `/campaigns/${c.id}/content`)
			if(content.html) fs.writeFileSync(path.join(folder, 'content.html'), content.html)
		} catch {}
	}
}

async function exportFileManager(auth)
{
	console.log('\n🔄 Exporting file manager...')
	const dir = path.join(baseDir, 'assets')
	ensureDir(dir)

	try {
		const files = await apiRequest(auth, '/file-manager/files')
		await writeJSON(dir, 'files.json', files)
	} catch {}
}

async function exportSurveys(auth)
{
	console.log('\n🔄 Exporting surveys...')
	const dir = path.join(baseDir, 'surveys')
	ensureDir(dir)

	try {
		const surveys = await apiRequest(auth, '/surveys')
		await writeJSON(dir, 'surveys.json', surveys)
	} catch {}
}

async function exportEcommerce(auth)
{
	console.log('\n🔄 Exporting ecommerce...')
	const dir = path.join(baseDir, 'ecommerce/stores')
	ensureDir(dir)

	const { stores } = await apiRequest(auth, '/ecommerce/stores?count=100')
	for(const s of stores)
	{
		const folder = path.join(dir, `${sanitize(s.name)}-${s.id}`)
		ensureDir(folder)

		await writeJSON(folder, 'store.json', s)

		try {
			const orders = await apiRequest(auth, `/ecommerce/stores/${s.id}/orders`)
			await writeJSON(folder, 'orders.json', orders)
		} catch {}
	}
}

async function main()
{
	console.log('🚀 Starting full Mailchimp export...')
	const auth = readApiKey()

	await exportCampaigns(auth)
	await exportTemplates(auth)
	await exportAutomations(auth)
	await exportAudienceMetadata(auth)
	await exportAudienceMembers(auth)
	await exportLandingPages(auth)
	await exportFileManager(auth)
	await exportSurveys(auth)
	await exportEcommerce(auth)

	console.log('✅ Export complete')
}

main().catch(err => {
	console.error('❌ Fatal:', err.message)
	process.exit(1)
})