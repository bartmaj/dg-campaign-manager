/**
 * Archive page (#029, REQ-018).
 *
 * Single CTA — download the whole campaign as a Markdown ZIP. The
 * archive is generated server-side by `serveCampaignArchive` and
 * round-trips back through the Import page (REQ-016).
 *
 * Uses `href="/api/campaigns/all/archive"` because the project doesn't
 * yet have a multi-campaign UI — `all` semantics dump everything in the
 * DB. TODO: switch to a per-campaign id once a campaign picker exists.
 */
import Card from '../../components/ui/Card'
import Heading from '../../components/ui/Heading'
import LinkButton from '../../components/ui/LinkButton'
import Prose from '../../components/ui/Prose'
import Stack from '../../components/ui/Stack'

function ArchivePage() {
  return (
    <Stack gap="md">
      <Heading level={1}>Archive</Heading>
      <Card>
        <Stack gap="md">
          <Prose>
            All entities as one Markdown file per row, in a ZIP. Re-import via the Import page to
            reconstruct the campaign (best-effort; lossy on derived fields).
          </Prose>
          <div>
            <LinkButton variant="primary" href="/api/campaigns/all/archive" download>
              Download archive (ZIP)
            </LinkButton>
          </div>
        </Stack>
      </Card>
    </Stack>
  )
}

export default ArchivePage
