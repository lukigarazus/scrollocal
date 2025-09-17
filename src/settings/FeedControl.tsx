import { useMemo } from "react";
import Select from "react-select";
import invert from "invert-color";

import { useSettings } from "../contexts/SettingsContext";
import { useTags } from "../contexts/TagContext";
import {
  LOCAL_FEED_NAME,
  useLocalFeed,
} from "../contexts/LocalFeedContext/LocalFeedContext";
import { useFeed } from "../contexts/FeedContext";
import { Section, Sections } from "../components/Section";
import { LocalFileControl } from "./LocalFileControl";
import { RemoteFeedControl } from "./RemoteFeedControl";
import { useFilter } from "../contexts/FilterContext";
import { REMOTE_FEED_NAME } from "../contexts/RemoteFeedContext/RemoteFeedContext";

function BooleanControl({ name, value, setValue }: any) {
  return (
    <div>
      <label htmlFor={name}>{name}</label>
      <input
        id={name}
        type="checkbox"
        checked={value}
        onChange={() => setValue(!value)}
      />
    </div>
  );
}

function TagSelect() {
  const { setTags, tags: filterTags } = useFilter();
  const { tags } = useTags();
  const tagOptions = useMemo(
    () =>
      tags.map((tag) => ({
        value: tag,
        label: tag.name,
        color: tag.color,
      })),
    [tags],
  );
  const filterTagOptions = useMemo(
    () =>
      filterTags.map((tag) => ({
        value: tag,
        label: tag.name,
        color: tag.color,
      })),
    [filterTags],
  );
  return (
    <>
      <label htmlFor="tags-filter">Tags</label>
      <Select
        id="tags-filter"
        options={tagOptions}
        isMulti
        value={filterTagOptions}
        onChange={(tags) => setTags(tags.map((t: any) => t.value))}
        styles={{
          option: (styles, { data }) => {
            return {
              ...styles,
              backgroundColor: data.color || "#fff",
              color: invert(data.color || "#000", true),
            };
          },
          multiValue: (styles, { data }) => {
            return {
              ...styles,
              backgroundColor: data.color || "#fff",
              color: invert(data.color || "#000", true),
            };
          },
        }}
      />
    </>
  );
}

const h2 = (props: any) => <h3 {...props} />;

export function FeedControl() {
  const { randomize, setRandomize } = useLocalFeed();
  const { feedNames, switchFeedEnablement, isFeedEnabled } = useFeed();
  const {
    autoplay,
    setAutoplay,
    showControlsInGalleryView,
    setShowControlsInGalleryView,
  } = useSettings();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: "5px",
      }}
    >
      <Sections>
        <Section name="Choose your feeds" as={h2}>
          {feedNames.map((feedName) => (
            <BooleanControl
              key={feedName}
              name={feedName}
              value={isFeedEnabled(feedName)}
              setValue={() => switchFeedEnablement(feedName)}
            />
          ))}
        </Section>
        {isFeedEnabled(LOCAL_FEED_NAME) && (
          <Section name="Local feed settings" as={h2}>
            <BooleanControl
              name="Randomize local files"
              value={randomize}
              setValue={setRandomize}
            />
            <LocalFileControl />
          </Section>
        )}
        {isFeedEnabled(REMOTE_FEED_NAME) && (
          <Section name="Remote feed settings" as={h2}>
            <RemoteFeedControl />
          </Section>
        )}
        <Section name="Player settings" as={h2}>
          <BooleanControl
            name="Autoplay"
            value={autoplay}
            setValue={setAutoplay}
          />
          <BooleanControl
            name="Show controls in gallery view"
            value={showControlsInGalleryView}
            setValue={setShowControlsInGalleryView}
          />
        </Section>
        <Section name="Tags" as={h2}>
          <TagSelect />
        </Section>
      </Sections>
    </div>
  );
}
