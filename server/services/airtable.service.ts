import Airtable from 'airtable';

// Configure Airtable
const base = new Airtable({ 
  apiKey: process.env.AIRTABLE_API_KEY 
}).base(process.env.AIRTABLE_BASE_ID!);

export interface AirtableCompany {
  id: string;
  name: string;
  type: string;
  status: string;
  website?: string;
  industry?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  createdTime: string;
  [key: string]: any; // Allow for additional fields
}

export interface AirtableRenderingReport {
  id: string;
  companyName: string;
  clientTraffic?: string;
  clientKeywords?: string;
  clientBacklinks?: string;
  competitorScores?: any[];
  createdTime: string;
  [key: string]: any;
}

class AirtableService {
  async getCompanies(tableName: string = 'Companies'): Promise<AirtableCompany[]> {
    try {
      const records = await base(tableName).select({
        view: 'Grid view' // Default view, can be customized
      }).all();

      return records.map(record => ({
        id: record.id,
        name: record.get('Name') as string || '',
        type: record.get('Type') as string || 'client',
        status: record.get('Status') as string || 'active',
        website: record.get('Website') as string,
        industry: record.get('Industry') as string,
        contactEmail: record.get('Contact Email') as string,
        contactPhone: record.get('Contact Phone') as string,
        address: record.get('Address') as string,
        city: record.get('City') as string,
        state: record.get('State') as string,
        zipCode: record.get('Zip Code') as string,
        country: record.get('Country') as string,
        createdTime: record.get('_createdTime') as string || new Date().toISOString(),
        // Include all other fields dynamically
        ...Object.fromEntries(
          Object.entries(record.fields).filter(([key]) => 
            !['Name', 'Type', 'Status', 'Website', 'Industry', 'Contact Email', 
             'Contact Phone', 'Address', 'City', 'State', 'Zip Code', 'Country', '_createdTime'].includes(key)
          )
        )
      }));
    } catch (error) {
      console.error('Error fetching companies from Airtable:', error);
      throw new Error(`Failed to fetch companies from Airtable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCompanyById(tableName: string = 'Companies', recordId: string): Promise<AirtableCompany | null> {
    try {
      const record = await base(tableName).find(recordId);
      
      return {
        id: record.id,
        name: record.get('Name') as string || '',
        type: record.get('Type') as string || 'client',
        status: record.get('Status') as string || 'active',
        website: record.get('Website') as string,
        industry: record.get('Industry') as string,
        contactEmail: record.get('Contact Email') as string,
        contactPhone: record.get('Contact Phone') as string,
        address: record.get('Address') as string,
        city: record.get('City') as string,
        state: record.get('State') as string,
        zipCode: record.get('Zip Code') as string,
        country: record.get('Country') as string,
        createdTime: record.get('_createdTime') as string || new Date().toISOString(),
        ...Object.fromEntries(
          Object.entries(record.fields).filter(([key]) => 
            !['Name', 'Type', 'Status', 'Website', 'Industry', 'Contact Email', 
             'Contact Phone', 'Address', 'City', 'State', 'Zip Code', 'Country', '_createdTime'].includes(key)
          )
        )
      };
    } catch (error) {
      console.error('Error fetching company from Airtable:', error);
      return null;
    }
  }

  async syncCompanyToDatabase(airtableCompany: AirtableCompany): Promise<void> {
    // This method can be used to sync Airtable data with your PostgreSQL database
    // Implementation depends on your specific sync requirements
    console.log('Syncing company to database:', airtableCompany.name);
  }

  async getRenderingReports(companyNameFilter?: string): Promise<AirtableRenderingReport[]> {
    try {
      const records = await base('Rendering Reports').select({
        view: 'Grid view'
      }).all();

      const reports = records.map(record => {
        // Get competitor scores - it might be a JSON string or an object
        let competitorScores = [];
        const competitorScoresField = record.get('competitorScores');
        
        if (competitorScoresField) {
          if (typeof competitorScoresField === 'string') {
            try {
              competitorScores = JSON.parse(competitorScoresField);
            } catch (e) {
              console.error('Error parsing competitorScores:', e);
              competitorScores = [];
            }
          } else if (Array.isArray(competitorScoresField)) {
            competitorScores = competitorScoresField;
          } else if (typeof competitorScoresField === 'object') {
            // If it's an object, try to extract competitor data
            competitorScores = [competitorScoresField];
          }
        }

        return {
          id: record.id,
          companyName: record.get('Company') as string || record.get('company_name') as string || record.get('Company Name') as string || '',
          clientTraffic: record.get('client_traffic') as string || record.get('Client Traffic') as string || '',
          clientKeywords: record.get('client_keywords') as string || record.get('Client Keywords') as string || '',
          clientBacklinks: record.get('client_backlinks') as string || record.get('Client Backlinks') as string || '',
          competitorScores: competitorScores,
          createdTime: record.get('_createdTime') as string || new Date().toISOString(),
          // Include all other fields dynamically  
          fields: record.fields,
          ...Object.fromEntries(
            Object.entries(record.fields).filter(([key]) => 
              !['Company', 'company_name', 'Company Name', 'client_traffic', 'Client Traffic', 
               'client_keywords', 'Client Keywords', 'client_backlinks', 'Client Backlinks',
               'competitorScores', '_createdTime'].includes(key)
            )
          )
        };
      });
      
      // Debug: Log all company names found in Airtable
      console.log('📊 All company names in Airtable rendering reports:', reports.map(r => r.companyName));
      
      // Filter by company name if provided
      if (companyNameFilter) {
        console.log(`🔍 Filtering for company: "${companyNameFilter}"`);
        const filteredReports = reports.filter(report => 
          this.matchesCompanyName(report.companyName, companyNameFilter)
        );
        console.log(`✅ Found ${filteredReports.length} matching reports`);
        return filteredReports;
      }
      
      return reports;
    } catch (error) {
      console.error('Error fetching rendering reports from Airtable:', error);
      throw new Error(`Failed to fetch rendering reports from Airtable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  private matchesCompanyName(airtableCompanyName: string, filterCompanyName: string): boolean {
    if (!airtableCompanyName || !filterCompanyName) {
      return false;
    }
    
    // Normalize both names for comparison
    const normalize = (name: string) => 
      name.toLowerCase()
          .replace(/[^a-z0-9\s]/g, '') // Remove punctuation but keep spaces initially
          .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
          .trim();
    
    const normalizedAirtable = normalize(airtableCompanyName);
    const normalizedFilter = normalize(filterCompanyName);
    
    console.log(`🔍 Comparing: "${normalizedAirtable}" vs "${normalizedFilter}"`);
    
    // Direct match
    if (normalizedAirtable === normalizedFilter) {
      console.log('✅ Direct match found');
      return true;
    }
    
    // Remove all spaces for more flexible matching
    const compactAirtable = normalizedAirtable.replace(/\s+/g, '');
    const compactFilter = normalizedFilter.replace(/\s+/g, '');
    
    if (compactAirtable === compactFilter) {
      console.log('✅ Compact match found');
      return true;
    }
    
    // Check if one contains the other (for cases like "Units Lab" vs "Units Lab AI")
    if (normalizedAirtable.includes(normalizedFilter) || normalizedFilter.includes(normalizedAirtable)) {
      console.log('✅ Partial match found');
      return true;
    }
    
    // Check compact versions for partial matches
    if (compactAirtable.includes(compactFilter) || compactFilter.includes(compactAirtable)) {
      console.log('✅ Compact partial match found');
      return true;
    }
    
    // Check individual words for better matching
    const airtableWords = normalizedAirtable.split(' ').filter(w => w.length > 2);
    const filterWords = normalizedFilter.split(' ').filter(w => w.length > 2);
    
    // If most significant words match
    const commonWords = airtableWords.filter(word => 
      filterWords.some(filterWord => filterWord.includes(word) || word.includes(filterWord))
    );
    
    if (commonWords.length >= Math.min(airtableWords.length, filterWords.length) / 2) {
      console.log('✅ Word-based match found');
      return true;
    }
    
    console.log('❌ No match found');
    return false;
  }

  async getCompetitiveAnalysis(): Promise<any[]> {
    try {
      const records = await base('Competitive Analysis').select({
        view: 'Grid view'
      }).all();

      const competitiveData = [];
      
      for (const record of records) {
        const rawJsonResponse = record.get('Raw JSON Response') as string;
        const companyName = record.get('Company Name') as string || '';
        const recordId = record.id;
        
        if (rawJsonResponse) {
          try {
            // Parse the JSON data from the Raw JSON Response field
            const parsedData = JSON.parse(rawJsonResponse);
            
            // Structure the data with company information
            competitiveData.push({
              id: recordId,
              companyName: companyName,
              competitorAnalysis: parsedData,
              // Include any other fields from the record
              createdTime: record.get('_createdTime') as string || new Date().toISOString(),
              // Add any additional fields that might be in the table
              ...Object.fromEntries(
                Object.entries(record.fields).filter(([key]) => 
                  !['Raw JSON Response', 'Company Name', '_createdTime'].includes(key)
                )
              )
            });
          } catch (parseError) {
            console.error(`Error parsing JSON for company ${companyName}:`, parseError);
            // Include record even if JSON parsing fails
            competitiveData.push({
              id: recordId,
              companyName: companyName,
              competitorAnalysis: null,
              error: 'Failed to parse competitive analysis data',
              rawData: rawJsonResponse,
              createdTime: record.get('_createdTime') as string || new Date().toISOString()
            });
          }
        } else {
          // Include record with empty analysis
          competitiveData.push({
            id: recordId,
            companyName: companyName,
            competitorAnalysis: null,
            createdTime: record.get('_createdTime') as string || new Date().toISOString()
          });
        }
      }
      
      return competitiveData;
    } catch (error) {
      console.error('Error fetching competitive analysis from Airtable:', error);
      throw new Error(`Failed to fetch competitive analysis from Airtable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const airtableService = new AirtableService();